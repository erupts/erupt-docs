# Erupt JPA Database Extension

erupt-jpa extends standard Spring Data JPA to provide more powerful database query and operation capabilities for the Erupt framework. It is a required module for most Erupt projects.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Core Capabilities

- **LambdaQuery**: A strongly-typed query API that eliminates hardcoded strings
- **Multiple Data Sources**: Supports connecting to multiple databases simultaneously — see [Multiple Data Sources](/en/advanced/datasource)
- **Auto DDL**: Automatically creates or syncs table schemas based on entity classes (`generate-ddl: true`)
- **EruptDao**: Encapsulates common JPQL / JDBC operations — see [EruptDao Database Operations](/en/advanced/erupt-dao)

## Behavior Changes in 2.4.0

### LambdaQuery hits Hibernate's query cache

`EruptLambdaQuery` now names its parameter placeholders deterministically (prefix + ordinal). Previously every parameter got a random name, so the same chain of calls produced a different HQL text each time and Hibernate's query interpretation cache missed on every execution; now the same chain yields the same HQL and the parsed query is reused from the second call on. A nested `or()` gets its own prefix, so its parameters never collide with the enclosing query's when they are merged.

No code change is needed — existing `eruptDao.lambdaQuery(...)` calls benefit automatically.

### findDataById initializes collection fields

Before returning the entity, `findDataById` initializes its `@OneToMany` / `@ManyToMany` collections. These lazy collections used to be read after the lookup — by the detail view, print, templates, revision history and so on — which only worked while `open-in-view` kept the EntityManager open; with it off, or for `@EruptDataSource` models whose EntityManager is closed right after the lookup, the detail view threw `LazyInitializationException`.

The collections are now initialized inside the lookup under `SUPPORTS` propagation: no real transaction is started and nothing is flushed. `spring.jpa.open-in-view: false` is safe to set.

### Multi-tenancy: TenantFilter and allTenants()

For entities with a `@TenantId` attribute, Hibernate binds the session to one tenant and adds a tenant filter to every query on them (see [tenant data isolation](/en/modules/pro/erupt-tenant/development#data-isolation-mechanism)). When an operator needs every tenant's rows, or a scheduler walks all tenants, there are two explicit ways out:

```java
// One LambdaQuery across tenants: affects this read only, the session stays as it was
List<User> users = eruptDao.lambdaQuery(User.class)
        .like(User::getName, "admin")
        .allTenants()
        .list();

// Any piece of work across tenants: the filter is lifted while it runs and restored afterwards
List<Order> orders = TenantFilter.acrossTenants(entityManager, () ->
        entityManager.createQuery("select o from Order o", Order.class).getResultList());
```

:::warning Queries only
Loading another tenant's row by id still returns `null`, an insert is still stamped with the session's tenant, and `delete()` is not covered by `allTenants()`; those operations need a session of the target tenant.
:::

### Location fields: LocationConverter

A map field (`EditType.MAP`) can be declared as the `Location` type directly; `LocationConverter` (`@Converter(autoApply = true)`) stores it in one column as the JSON text the frontend map editor produces. Changing an entity field from `String` to `Location` needs neither a column change nor a data migration; give the column room for a name and address, e.g. `@Column(length = 500)`. See [Geographic Location MAP](/en/field-types/map) for usage.

```java
@Column(length = 500)
@EruptField(
    views = @View(title = "Location"),
    edit = @Edit(title = "Location", type = EditType.MAP)
)
private Location location;
```

### Other fixes

- **Oracle constraint errors**: foreign key (ORA-02291 / 02292), unique key (ORA-00001) and length overflow (ORA-12899) violations are now translated into friendly messages, as on MySQL, SQL Server and PostgreSQL, instead of surfacing the raw SQL exception.
- **No check constraint on enum columns stored by name**: a column mapped with `@Enumerated(EnumType.STRING)` is created as a plain varchar, so a constant added to the enum later is not rejected by databases created before it. Previously, on PostgreSQL, Hibernate attached `check (col in (...))` to every such column and the first write of a new constant failed. Enums still stored by ordinal keep the plain JPA mapping and are pointed out at startup.
