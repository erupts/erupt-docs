# FAQ

## The initial user and menus are not created at startup

Erupt initializes user data only once, marked by a `.erupt` folder. Delete the `.erupt` folder and restart the project to re-run the user/menu insertion SQL.

## How is the password encrypted on login?

> To disable password encryption on login, set `erupt-app.pwdTransferEncrypt` to `false` in your configuration file.

**2.0.0+**: The frontend applies three rounds of Base64 encoding before transmitting the password:

```javascript
btoa(btoa(btoa(pwd)))
```

**1.12.11 – 1.14.x**:

```
md5(md5(pwd) + account)
```


## There is no DDL SQL

Erupt uses JPA as its ORM layer and creates database tables automatically at startup, so no initialization SQL is needed.

## Where is the `.erupt` folder stored?

The marker file lives at `${System.getProperty("user.dir")} / .erupt /`.

The value of `System.getProperty("user.dir")` differs by environment:

| Deployment | Location |
| :---: | :---: |
| jar | Directory containing the jar |
| Tomcat on Linux | Tomcat installation directory |
| Tomcat on Windows | Tomcat's `bin` directory |

> Note: the folder starts with a dot, which is hidden by default on most operating systems.

## Sorting one-to-many

Add JPA's `@OrderBy` annotation:

```java
@OneToMany(cascade = CascadeType.ALL)
@JoinColumn(name = "xxxx_id")
@OrderBy("field")
private Set<Test> test;
```

## Replacing the browser tab logo (favicon)

Drop a `favicon.ico` file into the `public` directory.

## Using UUID as a primary key

```java
@Id
@GeneratedValue(generator = "system-uuid")
@GenericGenerator(name = "system-uuid", strategy = "uuid")
@Column(name = "id", length = 32)
@EruptField
private String id;
```

## One-to-many adds multiple rows but only one is saved

**Likely cause**: a one-to-many relationship is stored in a `Set`, and `Set` deduplication relies on the object's `hashCode()`. Check whether the "many" side uses Lombok's `@Data`, which overrides `hashCode()` and breaks `Set` deduplication.

**Fix**: replace `@Data` with `@Getter` and `@Setter`.

## `new RuntimeException()` is not shown to the frontend

A subtle change in Spring Boot 2.2 and 2.3: `RuntimeException` stack-trace messages are only sent to the frontend when explicitly enabled. Solutions:

- Set the new configuration `server.error.includeMessage`. The default is `NEVER`; just enable it.
- Throw with `throw new EruptWebApiRuntimeException("error info")`.
- Or throw `throw new EruptApiErrorTip("")` (supports rich UI styling).

## Getting the currently logged-in user

```java
@Autowired  // Note: when using @Autowired, the enclosing class must be a bean (e.g. @Service, @Component)
private EruptUserService eruptUserService;

public void test(){
    EruptUser eruptUser = eruptUserService.getCurrentEruptUser();
}
```

## Storing a column other than `id` for a many-to-one

Use `@JoinColumn(referencedColumnName = "code")` so that the `code` column is persisted:

```java
@ManyToOne
@JoinColumn(referencedColumnName = "code")
@EruptField(
    views = @View(title = "Article", column = "title"),
    edit = @Edit(title = "Article Selection", type = EditType.REFERENCE_TABLE,
         referenceTableType = @ReferenceTableType(label = "title", id = "id"))
)
private Article article_abc_def3;
```

## The Erupt frontend cannot parse the response

Erupt's API responses are being intercepted. Check whether you have a global response wrapper applied to all `@RestController` classes/methods, and narrow it down to a specific package instead.

## A menu pointing to an Erupt entity returns 404

Verify the `@EruptScan` configuration in your entry class — the scan path must include the package containing your entity.

## After saving a one-to-many, the "many" side loses data

When the "many" side holds a reference to the "one" side, that reference must be populated, otherwise the data is lost. Populate it via `dataProxy → beforeUpdate`.

## Database character-set issue

```
Caused "by": "java.sql.SQLException": Incorrect string "value": '\xE7\xB3\xBB\xE7\xBB\x9F...' for column 'name' at row 1
```

The database character set must be UTF-8. After changing it, drop the tables and restart the project.

## Disabling foreign-key constraints in one-to-many / many-to-one

```java
@ManyToOne
@JoinColumn(foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
private Test test;
```

## Static resources return 404

Troubleshoot:

1. Are you using `@EnableWebMvc`? If so, remove it.
2. Check whether `WebMvcAutoConfigurationAdapter` is being used as the resource loader.
3. If you really need `WebMvcConfigurationSupport` for resource loading, put the `addResourceHandlers` method inside your `WebMvcConfigurer` implementation.
