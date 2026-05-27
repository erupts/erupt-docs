# EruptDao Data Operations

`EruptDao` is a utility class built on top of Spring Data JPA that helps you work with Erupt entities to manage data programmatically.

## Basic Usage

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // Query using lambda (lambdaQuery supported since 1.12.11+)
    public void query() {
        List<Student> students = eruptDao.lambdaQuery(EruptUser.class)
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
        Student student = eruptDao.findById(Student.class, id);
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

## LambdaQuery

> Write queries using lambda expressions with strong typing and clean syntax. Supported since 1.12.11+.

```java
@Service
public class EruptLambdaQuery {

    @Resource
    private EruptDao eruptDao;

    public void select() {
        List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
            .like(EruptUser::getName, "e")
            .isNull(EruptUser::getWhiteIp)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .list();
    }

    public void one() {
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .isNull(EruptUser::getWhiteIp)
            .one();
    }

    public void orderBy() {
        List<EruptUser> eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .addCondition("whiteIp is null") // Raw JPQL condition; use Java property names (camelCase)
            .isNotNull(EruptUser::getCreateTime)
            .offset(1).limit(2)
            .orderBy(EruptUser::getCreateTime)
            .orderByDesc(EruptUser::getCreateTime)
            .list();
    }

    // Supported since 1.12.13+
    public void aggr() {
        Long count = eruptDao.lambdaQuery(EruptUser.class).count();

        Object max = eruptDao.lambdaQuery(EruptUser.class)
            .like(EruptUser::getName, "e")
            .max(EruptUser::getCreateTime);
    }

    // Query specific fields (supported since 1.12.15+)
    public void selectFields() {
        // Query a single field
        List<String> accounts = eruptDao.lambdaQuery(EruptUser.class).listSelect(EruptUser::getName);
        // Query multiple specific fields
        List<EruptUser> eruptUsers = eruptDao.lambdaQuery(EruptUser.class)
            .listSelect(EruptUser.class, EruptUser::getName, EruptUser::getExpireDate, EruptUser::getAccount);
        // Query specific fields and return a single result
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .eq(EruptUser::getAccount, "erupt")
            .oneSelect(EruptUser.class, EruptUser::getName, EruptUser::getAccount);
    }

    // Lambda Delete (supported since 1.12.23+)
    @Transactional // Note: @Transactional is required
    public void lambdaDelete() {
        eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .delete();
    }

    // Paginated query (supported since 1.13.2+)
    public void page() {
        SimplePage<EruptUser> users = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .page(10, 0);
        Long total = users.getTotal();
        List<EruptUser> list = users.getList();
    }
}
```

## Many-to-One Query (with Syntax)

> Supported since 1.12.20+. `with` is a domain function that navigates to a related object and opens a query on it.

```java
eruptDao.lambdaQuery(Network.class)
    .isNull(Network::isDeleted)
    .with(Network::getTag).eq(Tag::name, "name")
    .with().orderBy(Network::getCreateTime)
    .list();
```

Related entity definition:

```java
@ManyToOne
@JoinColumn(
    foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT) // Non-foreign key association
)
private Tag tag;
```

## Operating Multiple Data Sources via EruptDao

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    public void dbs() {
        EntityManager entityManager = eruptDao.getEntityManager("datasource-name");

        // Supported since 1.12.13+
        eruptDao.lambdaQuery(entityManager, EruptUser.class)
            .like(EruptUser::getName, "e")
            .min(EruptUser::getCreateTime);

        // Note: When operating on multiple data sources, you must close the EntityManager manually.
        // Forgetting to call close() will prevent the connection from being returned to the pool,
        // eventually exhausting all connections and throwing a connection timeout exception.
        entityManager.close();
    }
}
```

## LambdaQuery Method Reference

### Query Condition Methods

| Method | Description | Example |
| --- | --- | --- |
| `eq` | Equals | `.eq(User::getName, "John")` |
| `ne` | Not equals | `.ne(User::getStatus, "deleted")` |
| `like` | Like (pattern match) | `.like(User::getName, "Jo%")` |
| `in` | In collection | `.in(User::getId, 1, 2, 3)` |
| `notIn` | Not in collection | `.notIn(User::getId, 4, 5, 6)` |
| `ge` | Greater than or equal | `.ge(User::getAge, 18)` |
| `gt` | Greater than | `.gt(User::getCreateTime, "2023-01-01")` |
| `le` | Less than or equal | `.le(User::getScore, 100)` |
| `lt` | Less than | `.lt(User::getExpireTime, new Date())` |
| `isNull` | Is null | `.isNull(User::getDescription)` |
| `isNotNull` | Is not null | `.isNotNull(User::getPhone)` |

### Aggregate Function Methods

| Method | Description |
| --- | --- |
| `count` | Count |
| `min` | Minimum value |
| `max` | Maximum value |
| `sum` | Sum |
| `avg` | Average |

### Sorting and Pagination Methods

| Method | Description |
| --- | --- |
| `orderBy` | Ascending sort |
| `orderByDesc` | Descending sort |
| `offset` | Offset |
| `limit` | Limit the number of results |

## addCondition Syntax

`addCondition()` accepts raw JPQL (HQL) strings. The syntax follows the same rules as a JPQL WHERE clause:

- **Field names**: Use Java entity property names (camelCase), not database column names
- **Association properties**: Access with `.`, e.g., `dept.name = 'Engineering'`
- **String values**: Wrap in single quotes, e.g., `status = 'active'`

```java
// Correct: use Java property names
.addCondition("whiteIp is null")
.addCondition("dept.id = 1")
.addCondition("createTime > '2023-01-01'")

// Wrong: do not use database column names
// .addCondition("white_ip is null")  ❌
// .addCondition("create_time > '2023-01-01'")  ❌
```

> To prevent SQL injection, prefer the type-safe chaining methods (`eq`, `like`, etc.), which use parameterized queries internally. Use `addCondition` only for complex conditions that chaining methods cannot express.

## MyBatis

Erupt classes natively support LambdaQuery, dynamic table creation, and join queries — capabilities that fully replace what MyBatis Plus provides. Do not introduce both.

If your service requires complex SQL with XML-based dynamic assembly, you may introduce MyBatis for those cases. MyBatis is a JDBC tool; JPA is an ORM tool — they can coexist without any conflict.
