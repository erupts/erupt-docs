# Erupt JPA 数据库扩展

erupt-jpa 在标准 Spring Data JPA 的基础上，为 Erupt 框架提供更强大的数据库查询与操作能力，是大多数 Erupt 项目的必选模块。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 核心能力

- **LambdaQuery**：强类型查询 API，避免字符串硬编码
- **多数据源**：支持同时连接多个数据库，详见[多数据源](/zh/advanced/datasource)
- **自动建表**：根据实体类自动创建或同步表结构（`generate-ddl: true`）
- **EruptDao**：封装常用 JPQL / JDBC 操作，详见 [EruptDao 数据库操作](/zh/advanced/erupt-dao)

## 2.4.0 行为变化

### LambdaQuery 命中 Hibernate 查询缓存

`EruptLambdaQuery` 的参数占位符改为确定性命名（前缀 + 序号）。此前每个参数都用随机名，同一条链式调用每次生成的 HQL 文本都不一样，Hibernate 的查询解释缓存次次失效；现在同样的调用链产出同样的 HQL，第二次起直接复用解析结果。嵌套的 `or()` 使用自己的前缀，合并到外层查询时参数不会冲突。

无需改动代码，已有的 `eruptDao.lambdaQuery(...)` 自动受益。

### findDataById 预加载集合字段

`findDataById` 返回实体前，会把 `@OneToMany` / `@ManyToMany` 集合初始化好。此前这些懒加载集合是在查询之后由详情页、打印、模板、版本记录等读取的，只有 `open-in-view` 保持 EntityManager 打开时才可行；关闭 `open-in-view`，或 `@EruptDataSource` 模型的 EntityManager 在查询后即关闭时，详情页会抛出 `LazyInitializationException`。

现在集合在查询内部、`SUPPORTS` 传播级别下初始化：不开启真实事务，也不触发 flush。`spring.jpa.open-in-view: false` 可以放心设置。

### 多租户：TenantFilter 与 allTenants()

带 `@TenantId` 属性的实体，Hibernate 会把会话绑定到一个租户，并给它的每条查询加上租户过滤（见[多租户数据隔离](/zh/modules/pro/erupt-tenant/development#数据隔离机制)）。运营人员需要看全部租户的数据、定时任务需要遍历租户时，有两种显式的出口：

```java
// 单条 LambdaQuery 跨租户：只影响这一次读取，会话保持原样
List<User> users = eruptDao.lambdaQuery(User.class)
        .like(User::getName, "admin")
        .allTenants()
        .list();

// 任意一段工作跨租户：执行期间解除过滤，结束后恢复
List<Order> orders = TenantFilter.acrossTenants(entityManager, () ->
        entityManager.createQuery("select o from Order o", Order.class).getResultList());
```

:::warning 只影响查询
按 id 加载其他租户的行仍然返回 `null`，新增仍然以会话所属租户落库，`delete()` 也不受 `allTenants()` 覆盖；这些操作需要一个属于目标租户的会话。
:::

### Location 字段：LocationConverter

地图字段（`EditType.MAP`）可以直接声明为 `Location` 类型，`LocationConverter`（`@Converter(autoApply = true)`）把它按前端地图组件生成的 JSON 文本存入一列。实体字段从 `String` 改为 `Location` 不需要改列、不需要迁移已有数据；列要留出名称与地址的长度，例如 `@Column(length = 500)`。用法见[地理位置选择 MAP](/zh/field-types/map)。

```java
@Column(length = 500)
@EruptField(
    views = @View(title = "位置"),
    edit = @Edit(title = "位置", type = EditType.MAP)
)
private Location location;
```

### 其他修复

- **Oracle 约束错误提示**：外键（ORA-02291 / 02292）、唯一键（ORA-00001）与长度超限（ORA-12899）现在与 MySQL、SQL Server、PostgreSQL 一样翻译成友好的错误提示，不再抛出原始 SQL 异常。
- **按名称存储的枚举列不再生成 check 约束**：`@Enumerated(EnumType.STRING)` 的列建表时是普通 varchar，枚举以后新增常量不会被旧库拒绝。此前在 PostgreSQL 上 Hibernate 会给每个这样的列附加 `check (col in (...))`，新常量一写入即报错。仍用序号存储的枚举保持 JPA 原生映射，启动时会给出提示。
