# 链式查询（LambdaQuery）

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
            .addCondition("whiteIp is null") // 原生 JPQL 条件，字段名使用 Java 属性名（驼峰）
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

    // OR 条件查询，2.0.0 及以上版本支持
    public void orQuery() {
        List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
            .or(q -> q.eq(EruptUser::getAccount, "admin")
                      .eq(EruptUser::getAccount, "guest"))
            .list();
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

## 方法参考

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

## addCondition 语法说明

`addCondition()` 接受原始 JPQL（HQL）字符串，语法规则与 JPQL WHERE 子句相同：

- **字段名**：使用 Java 实体属性名（驼峰），不是数据库列名
- **关联属性**：用 `.` 访问，如 `dept.name = '研发部'`
- **字符串值**：用单引号包裹，如 `status = 'active'`

```java
// 正确：使用 Java 属性名
.addCondition("whiteIp is null")
.addCondition("dept.id = 1")
.addCondition("createTime > '2023-01-01'")

// 错误：不要使用数据库列名
// .addCondition("white_ip is null")  ❌
// .addCondition("create_time > '2023-01-01'")  ❌
```

> 如需防 SQL 注入，优先使用类型安全的链式方法（`eq`、`like` 等），它们内部已使用参数化查询。`addCondition` 用于表达链式方法无法覆盖的复杂条件。
