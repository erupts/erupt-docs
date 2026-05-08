# EruptDao 数据操作

EruptDao 是基于 Spring Data JPA 实现的一个工具类，帮助您复用 erupt 对象，实现数据管理。

## 基础使用

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // 通过对象查询
    // lambdaQuery 1.12.11 及以上版本支持
    public void query() {
        List<Student> students = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .list();
    }

    // 原生 sql 查询
    public void nativeQuery(Goods goods) {
        List<Map<String, Object>> list = eruptDao.getJdbcTemplate()
            .queryForList("select * from t_table");
    }

    // 通过 id 获取数据
    public void findById(Long id) {
        Student student = eruptDao.findById(Student.class, id);
    }

    // 新增
    @Transactional // 注意：需添加事务注解
    public void add(Student student) {
        eruptDao.persist(student);
        // 使用 flush 方法可以在线程结束前入库，如果批处理数据建议每千次（新增、更新、删除）调用一次 flush
        eruptDao.flush();
    }

    // 修改
    @Transactional // 注意：需添加事务注解
    public void modify(Student student) {
        student.setName("xxx");
        eruptDao.merge(student);
    }

    // 删除
    @Transactional // 注意：需添加事务注解
    public void delete(Student student) {
        eruptDao.delete(student);
    }
}
```

## LambdaQuery

> 可通过 lambda 写法操作 erupt 对象，强类型限制，代码简洁明了，1.12.11 及以上版本支持。

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
            .addCondition("whiteIp is null")
            .isNotNull(EruptUser::getCreateTime)
            .offset(1).limit(2)
            .orderBy(EruptUser::getCreateTime)
            .orderByDesc(EruptUser::getCreateTime)
            .list();
    }

    // 1.12.13 及以上版本支持
    public void aggr() {
        Long count = eruptDao.lambdaQuery(EruptUser.class).count();

        Object max = eruptDao.lambdaQuery(EruptUser.class)
            .like(EruptUser::getName, "e")
            .max(EruptUser::getCreateTime);
    }

    // 查询指定字段，1.12.15 及以上版本支持
    public void selectFields() {
        // 只查询单一字段
        List<String> accounts = eruptDao.lambdaQuery(EruptUser.class).listSelect(EruptUser::getName);
        // 只查询指定字段
        List<EruptUser> eruptUsers = eruptDao.lambdaQuery(EruptUser.class)
            .listSelect(EruptUser.class, EruptUser::getName, EruptUser::getExpireDate, EruptUser::getAccount);
        // 只查询指定字段，且返回单条结果
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .eq(EruptUser::getAccount, "erupt")
            .oneSelect(EruptUser.class, EruptUser::getName, EruptUser::getAccount);
    }

    // Lambda Delete，1.12.23 及以上版本支持
    @Transactional // 注意：需添加事务注解
    public void lambdaDelete() {
        eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .delete();
    }

    // 分页查询，1.13.2 及以上版本支持
    public void page() {
        SimplePage<EruptUser> users = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .page(10, 0);
        Long total = users.getTotal();
        List<EruptUser> list = users.getList();
    }
}
```

## 多对一查询（with 语法）

> 1.12.20 及以上版本支持。with 是域函数，可指向到指定对象，并对此开启查询。

```java
eruptDao.lambdaQuery(Network.class)
    .isNull(Network::isDeleted)
    .with(Network::getTag).eq(Tag::name, "name")
    .with().orderBy(Network::getCreateTime)
    .list();
```

关联实体定义：

```java
@ManyToOne
@JoinColumn(
    foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT) // 非外键关联
)
private Tag tag;
```

## 通过 EruptDao 操作多数据源

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    public void dbs() {
        EntityManager entityManager = eruptDao.getEntityManager("数据源名称");

        // 1.12.13 及以上版本支持
        eruptDao.lambdaQuery(entityManager, EruptUser.class)
            .like(EruptUser::getName, "e")
            .min(EruptUser::getCreateTime);

        // 注意：多数据源操作时，每次 sql 执行完成后需要手动调用关闭方法，否则会导致连接池溢出
        entityManager.close();
    }
}
```

## LambdaQuery 方法参考

### 查询条件方法

| 方法名 | 描述 | 示例 |
| --- | --- | --- |
| `eq` | 等于 | `.eq(User::getName, "张三")` |
| `ne` | 不等于 | `.ne(User::getStatus, "deleted")` |
| `like` | 模糊匹配 | `.like(User::getName, "张%")` |
| `in` | 在集合中 | `.in(User::getId, 1, 2, 3)` |
| `notIn` | 不在集合中 | `.notIn(User::getId, 4, 5, 6)` |
| `ge` | 大于等于 | `.ge(User::getAge, 18)` |
| `gt` | 大于 | `.gt(User::getCreateTime, "2023-01-01")` |
| `le` | 小于等于 | `.le(User::getScore, 100)` |
| `lt` | 小于 | `.lt(User::getExpireTime, new Date())` |
| `isNull` | 为空 | `.isNull(User::getDescription)` |
| `isNotNull` | 不为空 | `.isNotNull(User::getPhone)` |

### 聚合函数方法

| 方法名 | 描述 |
| --- | --- |
| `count` | 计数 |
| `min` | 最小值 |
| `max` | 最大值 |
| `sum` | 求和 |
| `avg` | 平均值 |

### 排序和分页方法

| 方法名 | 描述 |
| --- | --- |
| `orderBy` | 升序排序 |
| `orderByDesc` | 降序排序 |
| `offset` | 偏移量 |
| `limit` | 限制数量 |

## MyBatis

Erupt 类同时支持 LambdaQuery 查询 + 动态建表能力 + Join Query，mybatis plus 的能力可以通过 EruptLambdaQuery 完全代替，请勿重复引入。

如果你的服务中需要复杂的 SQL 定义，可以引入 MyBatis 执行复杂的 XML 拼接。MyBatis 是一个 jdbc 工具，JPA 是 ORM 工具，共存不会有任何问题。
