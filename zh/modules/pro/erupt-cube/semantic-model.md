# 语义建模

EruptCube 是 Erupt 框架提供的**零代码数据分析能力**，通过在 Java 类上添加注解，即可自动生成支持多维度下钻、指标聚合的数据分析视图，无需编写任何前端代码。

## 快速上手

只需三步，即可完成一个数据分析模块：

**第一步：创建 Cube 类，绑定数据源**

```java
@EruptCube(name = "订单分析", sql = "order_info", sqlType = SqlType.TABLE_NAME)
public class OrderCube {
    // ...
}
```

**第二步：声明维度（用于分组、筛选）**

```java
@Dimension(title = "渠道")
private String channel;

@Dimension(title = "下单时间")
private Date createTime;
```

**第三步：声明指标（聚合计算）**

```java
@Measure(title = "订单量", sql = "count(*)")
private Long orderCount;

@Measure(title = "总金额", sql = "sum(amount)")
private Double totalAmount;
```

启动后，Erupt 自动将该类注册为一个数据分析视图，并在 UI 中展示。

## 注解详解

### @EruptCube — 声明数据立方体

标注在类上，定义数据来源与基本配置。

```java
@EruptCube(
    name        = "显示名称",           // 必填
    sql         = "SQL 或表名",         // 必填
    sqlType     = SqlType.SUB_QUERY,    // 默认值，单表用 TABLE_NAME
    description = "",
    explores    = { @Explore(code = "overview", name = "Overview") },
    tags        = {},
    dataProxy   = {}
)
```

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `name` | UI 显示名称 | 必填 |
| `sql` | 子查询 SQL 或表名 | 必填 |
| `sqlType` | 数据源类型，见下方说明 | `SUB_QUERY` |
| `description` | 描述文本 | `""` |
| `explores` | 对外暴露的查询视图 | overview |
| `tags` | 分类标签，用于 UI 分组 | `{}` |
| `dataProxy` | 数据代理处理器 | `{}` |
| `datasource` | 指定数据源（多数据源场景） | `""` |

**sqlType 选择：**

| 场景 | sqlType | sql 填写内容 |
| --- | --- | --- |
| 单表，无 JOIN | `SqlType.TABLE_NAME` | 直接填表名，如 `"order_info"` |
| 多表 JOIN 或复杂查询 | `SqlType.SUB_QUERY`（默认） | 完整 SELECT 语句 |

### @Dimension — 声明维度

标注在字段上，用于描述性分类字段，支持分组和筛选。

```java
@Dimension(
    title = "渠道",       // 必填，UI 显示名
    sql   = "channel",   // 对应 SQL 列名；为空时自动取字段名
    type  = FieldType.AUTO
)
private String channel;
```

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `title` | UI 显示名称 | 必填 |
| `sql` | 对应 SQL 列名或函数 | `""`（取字段名） |
| `type` | 数据类型，见下方说明 | `AUTO` |
| `hidden` | 是否在 UI 中隐藏 | `false` |
| `tags` | 分类标签 | `{}` |

:::warning 注意
多表 JOIN 场景下，若列有别名（`column AS alias`），`sql` 必须填别名，而非原列名。
:::

### @Measure — 声明指标

标注在字段上，必须配合聚合函数使用。

```java
@Measure(
    title = "订单量",       // 必填，UI 显示名
    sql   = "count(*)"     // 必填，聚合 SQL 表达式
)
private Long orderCount;
```

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `title` | UI 显示名称 | 必填 |
| `sql` | 聚合函数表达式 | 必填 |
| `type` | 数据类型 | `AUTO` |
| `hidden` | 是否在 UI 中隐藏 | `false` |

**常用聚合表达式：**

```java
sql = "count(*)"                                       // 总行数
sql = "count(distinct user_id)"                        // 去重计数
sql = "sum(amount)"                                    // 求和
sql = "avg(duration)"                                  // 均值
sql = "max(score)"                                     // 最大值
sql = "min(price)"                                     // 最小值
sql = "sum(case when success then 1 else 0 end)"       // 条件计数（成功数）
sql = "sum(case when not success then 1 else 0 end)"   // 条件计数（失败数）
sql = "round(sum(amount) / count(*), 2)"               // 复合表达式（客单价）
```

### @Parameter — 声明查询参数

标注在字段上，用于运行时动态传入过滤条件，参数值会自动注入到 SQL 的 WHERE 子句中。

```java
@Parameter(
    title = "状态",
    type  = FieldType.STRING,
    vl    = {
        @VL(value = "1", label = "已完成"),
        @VL(value = "0", label = "待处理")
    }
)
private String status;
```

### FieldType — 数据类型

`type = FieldType.AUTO` 时，框架根据 Java 字段类型自动推断：

| Java 类型 | 推断结果 |
| --- | --- |
| `Short` / `Integer` / `Long` / `Double` / `Float` | `NUMBER` |
| `Date` / `LocalDateTime` / `LocalDate` | `DATE` |
| 其他（`String`、`Boolean`、枚举等） | `STRING` |

### @Explore — 查询视图

在 `@EruptCube` 的 `explores` 属性中配置，可定义多个不同视角的分析视图。

```java
@EruptCube(
    name = "订单分析",
    sql  = "order_info",
    sqlType = SqlType.TABLE_NAME,
    explores = {
        @Explore(code = "all",      name = "全部订单"),
        @Explore(code = "finished", name = "已完成", where = "status = 1"),
        @Explore(code = "failed",   name = "已取消", where = "status = 0")
    }
)
```

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| `code` | 唯一标识，不可重复 | 必填 |
| `name` | UI 显示名称 | 必填 |
| `where` | 追加的 WHERE 条件（自动 AND 拼接） | `""` |
| `parameters` | 固定视图参数，见 `@ExploreParameter` | `{}` |
| `joins` | 关联其他 Cube | `{}` |
| `dimensions` | 视图中使用的维度，不填则显示所有 | `{}` |
| `measures` | 视图中使用的指标，不填则显示所有 | `{}` |

## 完整示例

### 示例 1：直接引用单表

```java
@EruptCube(
    name    = "用户登录日志",
    sql     = "e_upms_login_log",
    sqlType = SqlType.TABLE_NAME
)
public class LoginLogCube {

    @Dimension(title = "用户名", sql = "user_name")
    private String userName;

    @Dimension(title = "IP 地址", sql = "ip")
    private String ip;

    @Dimension(title = "浏览器", sql = "browser")
    private String browser;

    @Dimension(title = "登录时间", sql = "login_time")
    private Date loginTime;

    @Measure(title = "登录次数", sql = "count(*)")
    private Long count;
}
```

### 示例 2：多表 JOIN 子查询

```java
@EruptCube(
    name = "通知日志分析",
    sql  = """
        select detail.status,
               detail.success,
               detail.create_time,
               detail.channel,
               detail.receive_user_id,
               log.title,
               scene.name
        from e_notice_log_detail detail
               inner join e_notice_log log on detail.notice_log_id = log.id
               inner join e_notice_scene scene on log.notice_scene_id = scene.id
        """
)
public class NoticeLogCube {

    @Dimension(title = "通知场景", sql = "name")   // 取别名/列名，而非字段名
    private String name;

    @Dimension(title = "发送渠道", sql = "channel")
    private String channel;

    @Dimension(title = "是否成功", sql = "success")
    private Boolean success;

    @Dimension(title = "创建时间", sql = "create_time")
    private Date createTime;

    @Measure(title = "总量", sql = "count(*)")
    private Long count;

    @Measure(title = "成功数", sql = "sum(case when success then 1 else 0 end)")
    private Long successCount;

    @Measure(title = "失败数", sql = "sum(case when not success then 1 else 0 end)")
    private Long failCount;

    @Measure(title = "接收用户数（去重）", sql = "count(distinct receive_user_id)")
    private Long uniqueReceivers;
}
```

### 示例 3：与 @Erupt 实体类共用

当一个表既需要 CRUD 管理页面又需要数据分析视图时，可将两个注解放在同一个类上：

```java
@Entity
@Table(name = "e_upms_operate_log")
@Erupt(name = "操作日志", ...)
@EruptCube(name = "操作日志分析", sql = "e_upms_operate_log", sqlType = SqlType.TABLE_NAME)
public class EruptOperateLog extends BaseModel {

    // @Dimension 和 @EruptField 可以同时标注同一字段
    @Dimension(title = "操作用户", sql = "operate_user")
    @EruptField(views = @View(title = "操作人"), ...)
    private String operateUser;

    // JPA 实体中，指标字段必须加 @Transient 避免 ORM 映射
    @Transient
    @Measure(title = "操作次数", sql = "count(*)")
    private Long count;

    @Transient
    @Measure(title = "最大请求耗时", sql = "max(total_time)")
    private Long maxDuration;
}
```

## 常见问题

### Q：字段名和 SQL 列名不一致时怎么处理？

`@Dimension(sql = "列名或别名")` 填 SQL 中实际的列名或 `AS` 别名，Java 字段名可自由命名。

```java
// SQL: select create_time as ct from ...
@Dimension(title = "创建时间", sql = "ct", type = FieldType.DATE)
private Date createTime;  // Java 字段名随意，sql 属性决定 SQL 映射
```

### Q：纯 Cube 类和 JPA 实体类的区别？

- **纯 Cube 类**（不继承 BaseModel、不带 @Entity）：指标字段无需 `@Transient`
- **JPA 实体类**（带 @Entity）：指标字段**必须**加 `@Transient`，否则 JPA 会尝试映射该虚拟列

### Q：Boolean 类型维度显示异常？

`Boolean` 字段在 `FieldType.AUTO` 模式下被推断为 `STRING`（按 `"true"/"false"` 字符串分组），这是预期行为，无需特殊处理。

### Q：如何对同一数据设置多个分析视角？

使用 `explores` 配置多个 `@Explore`，每个视图可指定独立的 `where` 条件，实现"全量"、"成功"、"失败"等不同维度的固定过滤。

> 关于注解字符串在 IDE 里如何获得 SQL / VTL 语法高亮与校验，见专题 [《注解里的那行字符串，不是哑字符串》](/zh/topics/annotation-language-injection)。
