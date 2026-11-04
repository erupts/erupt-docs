# EruptDao Overview

`EruptDao` is a utility class built on top of Spring Data JPA that helps you work with Erupt entities to manage data programmatically — **equivalent to the DAO layer in traditional development**.

Detailed usage for each capability is covered in the other documents of this group:

- [Chained Queries (LambdaQuery)](/en/advanced/erupt-dao-lambda): strongly-typed lambda queries, aggregation, pagination, association queries
- [Multi-Datasource Operations (getEntityManager)](/en/advanced/erupt-dao-datasource): run queries against a specific data source

## Basic Usage

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // Query using lambda (lambdaQuery supported since 1.12.11+)
    public void query() {
        List<EruptUser> users = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .list();
    }

    // Native SQL query
    public void nativeQuery(Goods goods) {
        List<Map<String, Object>> list = eruptDao.getJdbcTemplate()
            .queryForList("select * from t_table");
    }

    // Find by ID
    public void findById(Long id) {
        Student student = eruptDao.find(Student.class, id);
    }

    // Add
    @Transactional // Note: @Transactional is required
    public void add(Student student) {
        eruptDao.persist(student);
        // flush syncs pending operations in the current transaction to the database immediately (without committing)
        // In bulk operations, call flush every 500–1000 records to prevent OOM from accumulating too many changes
        eruptDao.flush();
    }

    // Update
    @Transactional // Note: @Transactional is required
    public void modify(Student student) {
        student.setName("xxx");
        eruptDao.merge(student);
    }

    // Delete
    @Transactional // Note: @Transactional is required
    public void delete(Student student) {
        eruptDao.delete(student);
    }
}
```

## Method Reference

### Query

| Signature | Returns | Description |
| --- | --- | --- |
| `find(Class<T> clazz, Object id)` | `T` | Finds a single entity by primary key; returns `null` when not found |
| `lambdaQuery(Class<T> eruptClass)` | `EruptLambdaQuery<T>` | Creates a chained query — see [Chained Queries](/en/advanced/erupt-dao-lambda) |
| `lambdaQuery(EntityManager em, Class<T> eruptClass)` | `EruptLambdaQuery<T>` | Creates a chained query against a specific `EntityManager` (data source) |

### Write

| Signature | Returns | Description |
| --- | --- | --- |
| `persist(Object obj)` | `void` | Inserts an entity |
| `persistAndFlush(Object obj)` | `void` | Inserts and then flushes immediately; the method carries its own `@Transactional` |
| `merge(T t)` | `T` | Updates an entity and returns the managed instance |
| `mergeAndFlush(T t)` | `T` | Updates and then flushes immediately (in a `finally` block); the method carries its own `@Transactional` |
| `delete(Object obj)` | `void` | Deletes an entity; a detached instance is merged first, then removed |
| `deleteAndFlush(Object obj)` | `void` | Deletes and then flushes immediately (in a `finally` block); the method carries its own `@Transactional` |
| `flush()` | `void` | Synchronizes pending changes in the persistence context to the database (without committing) |
| `persistIfNotExist(Class<T> eruptClass, T obj, String field, String val)` | `T` | Idempotent insert: looks up `field = val` first, returns the existing entity when found, otherwise persists and flushes `obj`. Throws `NonUniqueResultException` when the lookup matches more than one row |

`persistIfNotExist` is typically used to back-fill data during module initialization (the framework itself uses it to back-fill menus):

```java
// Returns the existing record when a menu with code = "myMenuCode" exists, otherwise inserts newMenu
EruptMenu menu = eruptDao.persistIfNotExist(
    EruptMenu.class, newMenu, LambdaSee.field(EruptMenu::getCode), "myMenuCode");
```

### Persistence Context

| Signature | Returns | Description |
| --- | --- | --- |
| `detach(Object obj)` | `void` | Detaches an entity from the persistence context. Later modifications to that object are no longer synchronized to the database |
| `getEntityManager()` | `EntityManager` | Returns the default data source's `EntityManager` (Lombok `@Getter`) |
| `getEntityManager(String name)` | `EntityManager` | Returns the `EntityManager` for a named data source. **You must call `close()` on it yourself** — see [Multi-Datasource Operations](/en/advanced/erupt-dao-datasource) |

The typical use of `detach` is "read it, tweak it for the response, but do not let the tweak reach the database":

```java
@Transactional(readOnly = true)
public Student maskStudent(Long id) {
    Student student = eruptDao.find(Student.class, id);
    // Detach before modifying, so dirty checking cannot flush the change back
    eruptDao.detach(student);
    student.setIdCard("****");
    return student;
}
```

### Native SQL

| Signature | Returns | Description |
| --- | --- | --- |
| `getJdbcTemplate()` | `JdbcTemplate` | Spring's plain `JdbcTemplate`, using positional `?` placeholders (Lombok `@Getter`) |
| `getNamedParameterJdbcTemplate()` | `NamedParameterJdbcTemplate` | The named-parameter variant, using `:name` placeholders (Lombok `@Getter`) |

Native SQL **must** bind values through placeholders — never concatenate strings:

```java
// Positional placeholders
List<Map<String, Object>> rows = eruptDao.getJdbcTemplate()
    .queryForList("select * from t_student where grade = ? and status = ?", grade, status);

// Named parameters: more readable once there are several conditions
Map<String, Object> params = new HashMap<>();
params.put("grade", grade);
params.put("status", status);
List<Map<String, Object>> rows2 = eruptDao.getNamedParameterJdbcTemplate()
    .queryForList("select * from t_student where grade = :grade and status = :status", params);
```

::: warning Never concatenate SQL
Writing `"... where name = '" + userInput + "'"` opens a SQL injection hole. Any query containing external input must go through placeholder binding.
:::

## MyBatis

Erupt classes natively support LambdaQuery, dynamic table creation, and join queries — capabilities that fully replace what MyBatis Plus provides. Do not introduce both.

If your service requires complex SQL with XML-based dynamic assembly, you may introduce MyBatis for those cases. MyBatis is a JDBC tool; JPA is an ORM tool — they can coexist without any conflict.
