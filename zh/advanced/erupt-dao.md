# EruptDao 概览

EruptDao 是基于 Spring Data JPA 实现的一个工具类，帮助您复用 erupt 对象，实现数据管理，**相当于传统开发中的 DAO 层**。

各能力的详细用法见本分组下的其他文档：

- [链式查询（LambdaQuery）](/zh/advanced/erupt-dao-lambda)：lambda 强类型查询、聚合、分页、关联查询
- [多数据源操作（getEntityManager）](/zh/advanced/erupt-dao-datasource)：在指定数据源上执行查询

## 基础使用

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // 通过对象查询
    // lambdaQuery 1.12.11 及以上版本支持
    public void query() {
        List<EruptUser> users = eruptDao.lambdaQuery(EruptUser.class)
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
        Student student = eruptDao.find(Student.class, id);
    }

    // 新增
    @Transactional // 注意：需添加事务注解
    public void add(Student student) {
        eruptDao.persist(student);
        // flush 将当前事务中的挂起操作立即同步到数据库（不提交事务）
        // 批量操作时建议每 500~1000 次调用一次，防止内存中积压过多变更导致 OOM
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

## 方法参考

### 查询

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `find(Class<T> clazz, Object id)` | `T` | 按主键查询单个实体，未找到返回 `null` |
| `lambdaQuery(Class<T> eruptClass)` | `EruptLambdaQuery<T>` | 创建链式查询，详见 [链式查询](/zh/advanced/erupt-dao-lambda) |
| `lambdaQuery(EntityManager em, Class<T> eruptClass)` | `EruptLambdaQuery<T>` | 在指定 `EntityManager`（数据源）上创建链式查询 |

### 写入

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `persist(Object obj)` | `void` | 新增实体 |
| `persistAndFlush(Object obj)` | `void` | 新增后立即 `flush()`；方法自带 `@Transactional` |
| `merge(T t)` | `T` | 更新实体，返回被托管的实例 |
| `mergeAndFlush(T t)` | `T` | 更新后立即 `flush()`（在 `finally` 中执行）；方法自带 `@Transactional` |
| `delete(Object obj)` | `void` | 删除实体；若实体处于游离态会先 `merge` 再 `remove` |
| `deleteAndFlush(Object obj)` | `void` | 删除后立即 `flush()`（在 `finally` 中执行）；方法自带 `@Transactional` |
| `flush()` | `void` | 将当前持久化上下文中的挂起变更同步到数据库（不提交事务） |
| `persistIfNotExist(Class<T> eruptClass, T obj, String field, String val)` | `T` | 幂等新增：先按 `field = val` 查询，存在则直接返回已有实体，不存在才 `persist` 并 `flush`。查询命中多条时抛 `NonUniqueResultException` |

`persistIfNotExist` 常用于模块初始化时补建数据（框架内部用它来补建菜单）：

```java
// 若 code = "myMenuCode" 的菜单已存在则返回已有记录，否则插入 newMenu
EruptMenu menu = eruptDao.persistIfNotExist(
    EruptMenu.class, newMenu, LambdaSee.field(EruptMenu::getCode), "myMenuCode");
```

### 持久化上下文

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `detach(Object obj)` | `void` | 将实体从持久化上下文中剥离，使其变为游离态。此后对该对象的修改不会被自动同步到数据库 |
| `getEntityManager()` | `EntityManager` | 获取默认数据源的 `EntityManager`（Lombok `@Getter`） |
| `getEntityManager(String name)` | `EntityManager` | 按数据源名称获取 `EntityManager`，**用完必须手动调用 `close()`**，详见 [多数据源操作](/zh/advanced/erupt-dao-datasource) |

`detach` 的典型用法是「读出来改一改再返回给前端，但不希望改动落库」：

```java
@Transactional(readOnly = true)
public Student maskStudent(Long id) {
    Student student = eruptDao.find(Student.class, id);
    // 剥离后再改，脏检查不会把修改刷回数据库
    eruptDao.detach(student);
    student.setIdCard("****");
    return student;
}
```

### 原生 SQL

| 方法签名 | 返回值 | 说明 |
| --- | --- | --- |
| `getJdbcTemplate()` | `JdbcTemplate` | Spring 原生 `JdbcTemplate`，使用 `?` 位置占位符（Lombok `@Getter`） |
| `getNamedParameterJdbcTemplate()` | `NamedParameterJdbcTemplate` | 具名参数版 `JdbcTemplate`，使用 `:name` 占位符（Lombok `@Getter`） |

写原生 SQL 时**必须使用占位符绑定参数**，不要拼接字符串：

```java
// 位置占位符
List<Map<String, Object>> rows = eruptDao.getJdbcTemplate()
    .queryForList("select * from t_student where grade = ? and status = ?", grade, status);

// 具名参数：条件较多时可读性更好
Map<String, Object> params = new HashMap<>();
params.put("grade", grade);
params.put("status", status);
List<Map<String, Object>> rows2 = eruptDao.getNamedParameterJdbcTemplate()
    .queryForList("select * from t_student where grade = :grade and status = :status", params);
```

::: warning 不要拼接 SQL
`"... where name = '" + userInput + "'"` 这种写法会造成 SQL 注入，任何包含外部输入的查询都必须走占位符绑定。
:::

## MyBatis

Erupt 类同时支持 LambdaQuery 查询 + 动态建表能力 + Join Query，mybatis plus 的能力可以通过 EruptLambdaQuery 完全代替，请勿重复引入。

如果你的服务中需要复杂的 SQL 定义，可以引入 MyBatis 执行复杂的 XML 拼接。MyBatis 是一个 jdbc 工具，JPA 是 ORM 工具，共存不会有任何问题。
