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

## 动态条件：`boolean condition` 首参重载

**几乎每一个条件方法都提供了一个以 `boolean condition` 作为第一个参数的重载。** 当 `condition` 为 `false` 时，该条件会被整个跳过，链式调用继续向下传递。这意味着构建动态查询时**不需要写 `if` 语句**：

```java
// 传统写法：需要中断链式调用
EruptLambdaQuery<EruptUser> query = eruptDao.lambdaQuery(EruptUser.class);
if (StringUtils.isNotBlank(name)) {
    query.like(EruptUser::getName, name);
}
if (null != status) {
    query.eq(EruptUser::getStatus, status);
}
List<EruptUser> list = query.list();

// 推荐写法：condition 重载，全程链式
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .like(StringUtils.isNotBlank(name), EruptUser::getName, name)
    .eq(null != status, EruptUser::getStatus, status)
    .in(null != ids && !ids.isEmpty(), EruptUser::getId, ids)
    .orderByDesc(sortByTime, EruptUser::getCreateTime)
    .list();
```

> 注意：`or(...)` 与 `addParam(...)` 没有 `condition` 重载。

## 方法参考

### 查询条件方法

下表中每个方法均提供两个（或更多）重载：不带 `condition` 的常规版本，以及首参为 `boolean condition` 的动态版本。

| 方法签名 | 说明 |
| --- | --- |
| `eq(SFunction field, Object val)`<br>`eq(boolean condition, SFunction field, Object val)` | 等于，`field = :val` |
| `ne(SFunction field, Object val)`<br>`ne(boolean condition, SFunction field, Object val)` | 不等于，`field <> :val` |
| `gt(SFunction field, Object val)`<br>`gt(boolean condition, SFunction field, Object val)` | 大于 |
| `ge(SFunction field, Object val)`<br>`ge(boolean condition, SFunction field, Object val)` | 大于等于 |
| `lt(SFunction field, Object val)`<br>`lt(boolean condition, SFunction field, Object val)` | 小于 |
| `le(SFunction field, Object val)`<br>`le(boolean condition, SFunction field, Object val)` | 小于等于 |
| `isNull(SFunction field)`<br>`isNull(boolean condition, SFunction field)` | `field is null` |
| `isNotNull(SFunction field)`<br>`isNotNull(boolean condition, SFunction field)` | `field is not null` |
| `between(SFunction field, Object val1, Object val2)`<br>`between(boolean condition, SFunction field, Object val1, Object val2)` | `field between :val1 and :val2` |
| `notBetween(SFunction field, Object val1, Object val2)`<br>`notBetween(boolean condition, SFunction field, Object val1, Object val2)` | `field not between :val1 and :val2` |
| `in(SFunction field, Collection<?> val)`<br>`in(SFunction field, Object... val)`<br>`in(boolean condition, SFunction field, Collection<?> val)`<br>`in(boolean condition, SFunction field, Object... val)` | `field in (...)` |
| `notIn(SFunction field, Collection<?> val)`<br>`notIn(SFunction field, Object... val)`<br>`notIn(boolean condition, SFunction field, Collection<?> val)`<br>`notIn(boolean condition, SFunction field, Object... val)` | `field not in (...)` |
| `like(SFunction field, Object val)`<br>`like(boolean condition, SFunction field, Object val)` | 模糊匹配，**框架自动在值两端补 `%`**，即传入 `"abc"` 实际匹配 `%abc%` |
| `likeValue(SFunction field, Object val)`<br>`likeValue(boolean condition, SFunction field, Object val)` | 模糊匹配，**值原样使用，通配符由你自己写**，如 `"abc%"` 表示前缀匹配 |
| `or(Consumer<EruptLambdaQuery<T>> consumer)` | 将子查询中的条件用 `or` 连接后整体括起来，追加到当前 where |

`like` 与 `likeValue` 的区别：

```java
// 包含匹配：生成 name like '%erupt%'
.like(EruptUser::getName, "erupt")

// 前缀匹配：生成 name like 'erupt%'
.likeValue(EruptUser::getName, "erupt%")
```

### 自定义条件与参数

| 方法签名 | 说明 |
| --- | --- |
| `addCondition(String expr, Map<String, Object> params)` | **推荐**。追加自定义 JPQL 条件，`expr` 中用 `:占位符` 引用 `params` 中的值，参数化绑定，防注入 |
| `addCondition(boolean condition, String expr, Map<String, Object> params)` | 同上，`condition` 为 `false` 时跳过 |
| `addCondition(String expr)` | 直接追加字符串条件，**不做任何参数绑定** |
| `addCondition(boolean condition, String expr)` | 同上，`condition` 为 `false` 时跳过 |
| `addParam(String key, Object val)` | 仅向参数表中放入一个占位符的值，不追加任何 where 条件。用于给先前 `addCondition(String)` 中写好的占位符补值 |

### 域函数（关联查询）

| 方法签名 | 说明 |
| --- | --- |
| `with(SFunction field)` | 将后续条件/排序的作用域切换到关联对象上 |
| `with()` | 清空作用域，回到主实体 |

### 聚合函数方法

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `count()` | `Long` | `count(*)` |
| `count(SFunction field)` | `Long` | `count(field)`，不统计该字段为 null 的行 |
| `sum(SFunction field)` | `Object` | 求和 |
| `avg(SFunction field)` | `Double` | 平均值 |
| `min(SFunction field)` | `Object` | 最小值 |
| `max(SFunction field)` | `Object` | 最大值 |

> 聚合方法生成的 SQL 不带 `order by`。

### 排序、分页与去重

| 方法签名 | 说明 |
| --- | --- |
| `orderBy(SFunction field)` / `orderBy(boolean condition, SFunction field)` | 升序排序 |
| `orderByAsc(SFunction field)` / `orderByAsc(boolean condition, SFunction field)` | 升序排序，`orderBy` 的语义化别名，行为完全一致 |
| `orderByDesc(SFunction field)` / `orderByDesc(boolean condition, SFunction<T, ?> field)` | 降序排序 |
| `limit(Integer limit)` | 限制返回条数 |
| `offset(Integer offset)` | 起始偏移量 |
| `page(int limit, int offset)` | 分页查询，返回 `SimplePage<T>`（含 `total` 与 `list`）；`total` 为 0 时不再执行列表查询 |
| `distinct()` | 结果去重 |

::: warning `distinct()` 的生效条件
`distinct()` 只有在 SELECT 子句存在时才会被拼接。因此它必须与 `listSelect` / `oneSelect` / `selectByPath` 或聚合方法配合使用；单独 `.distinct().list()` 不会产生 `distinct` 关键字。
:::

### 结果获取

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `list()` | `List<T>` | 返回实体列表 |
| `one()` | `T` | 返回单个实体，无结果时返回 `null`；多于一条会抛异常 |
| `listSelect(SFunction<T, S> field)` | `List<S>` | 只查询单个字段，返回该字段的值列表 |
| `oneSelect(SFunction<T, S> field)` | `S` | 只查询单个字段，返回单个值，无结果时返回 `null` |
| `listSelect(Class<R> requiredType, SFunction<T, ?>... fields)` | `List<R>` | 查询指定多个字段，反射映射到 `requiredType` 实例 |
| `oneSelect(Class<R> requiredType, SFunction<T, ?>... fields)` | `R` | 同上但只返回一条，无结果时返回 `null` |
| `selectByPath(Class<R> requiredType, String... fields)` | `List<R>` | 以**字符串属性路径**指定查询列，支持 `dept.name` 这类嵌套路径 |
| `delete()` | `int` | 逐条 `remove` 查询结果，返回删除条数，**需要事务** |
| `deleteAndFlush()` | `int` | 在 `delete()` 后立即 `flush()` |

`oneSelect(SFunction)` 单字段版本适合取单个标量值：

```java
// 只取一个用户名，不加载整个实体
String name = eruptDao.lambdaQuery(EruptUser.class)
    .eq(EruptUser::getAccount, "erupt")
    .oneSelect(EruptUser::getName);
```

::: warning `selectByPath` 不做对象映射
与 `listSelect(Class, SFunction...)` 不同，`selectByPath` 的 `requiredType` 参数**仅用于泛型推断，不会做任何反射赋值**，返回的是 JPA 的原始结果：

- 传入**单个**字段路径时，返回的是该字段值的列表（元素类型即字段类型）；
- 传入**多个**字段路径时，返回的是 `List<Object[]>`。

```java
// 单字段：直接拿到 String 列表
List<String> names = eruptDao.lambdaQuery(EruptUser.class)
    .selectByPath(String.class, "name");

// 嵌套路径 + 多字段：实际元素为 Object[]
List<Object[]> rows = eruptDao.lambdaQuery(EruptUser.class)
    .selectByPath(Object[].class, "name", "eruptOrg.name");
```
:::

## addCondition 语法说明

`addCondition()` 接受原始 JPQL（HQL）字符串，语法规则与 JPQL WHERE 子句相同：

- **字段名**：使用 Java 实体属性名（驼峰），不是数据库列名
- **关联属性**：用 `.` 访问，如 `dept.name = :deptName`
- **占位符**：用 `:名称` 声明，值通过 `params` 传入

### 推荐：参数化写法（防注入）

只要条件中包含外部输入（用户查询框、接口入参等），**必须使用带 `Map<String, Object> params` 的重载**，把值作为参数绑定，绝不要拼接进 SQL 字符串：

```java
Map<String, Object> params = new HashMap<>();
params.put("status", status);
params.put("start", startTime);

List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition("status = :status and createTime > :start", params)
    .list();
```

配合 `condition` 重载可以做动态参数化条件：

```java
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition(null != keyword, "name like :kw or account like :kw",
                  Collections.singletonMap("kw", "%" + keyword + "%"))
    .list();
```

也可以把条件与参数拆开写，用 `addParam` 单独补值：

```java
List<EruptUser> list = eruptDao.lambdaQuery(EruptUser.class)
    .addCondition("createTime between :start and :end")
    .addParam("start", startTime)
    .addParam("end", endTime)
    .list();
```

### 不推荐：字符串拼接

无参数的 `addCondition(String)` 直接把字符串拼进 JPQL，**一旦拼入外部输入即构成 SQL 注入漏洞**。它只应用于完全由代码控制的静态条件：

```java
// 可以：完全静态、无外部输入
.addCondition("whiteIp is null")
.addCondition("dept.id = 1")

// 禁止：拼接外部输入 ❌
// .addCondition("name = '" + userInput + "'")

// 错误：不要使用数据库列名 ❌
// .addCondition("white_ip is null")
// .addCondition("create_time > '2023-01-01'")
```

> 优先级建议：类型安全的链式方法（`eq`、`like`、`between` 等，内部已参数化） > `addCondition(expr, params)` > `addCondition(expr)`。
