# 搜索 @Search

`@Search` 注解配置字段是否出现在列表页顶部搜索栏中，以及搜索的匹配方式。

## 使用方法

```java
@EruptField(
    views = @View(title = "名称"),
    edit = @Edit(title = "名称", search = @Search)
)
private String name;
```

## 配置项

```java
public @interface Search {

    boolean value() default true; // 是否开启搜索

    boolean notNull() default false; // 是否为必填搜索项

    // 默认查询操作符（2.0.2+），当搜索条件未显式指定操作符时生效
    // AUTO 表示按组件类型自动解析（如 INPUT 默认 LIKE、NUMBER 默认 EQ）
    QueryExpression operator() default QueryExpression.AUTO;

}
```

**指定默认操作符示例（2.0.2+）：**

```java
@EruptField(
    views = @View(title = "名称"),
    edit = @Edit(title = "名称", search = @Search(operator = QueryExpression.EQ))
)
private String name;
```

:::tip
`vague` 属性已在 2.0.0 中移除，高级搜索（范围查询、模糊匹配等）现为各组件的默认行为，无需额外配置。
:::

## QueryExpression 搜索操作符

`QueryExpression` 枚举用于 `DataProxy.beforeFetch` 中构造 `Condition` 对象，也是前端搜索条件传至后端时使用的操作符类型。

| 操作符 | 说明 |
|--------|------|
| `EQ` | 等于 |
| `NEQ` | 不等于 |
| `GT` | 大于（2.0.0+） |
| `GTE` | 大于等于（2.0.0+） |
| `LT` | 小于（2.0.0+） |
| `LTE` | 小于等于（2.0.0+） |
| `LIKE` | 模糊匹配（包含） |
| `NOT_LIKE` | 不包含 |
| `RANGE` | 范围查询（区间） |
| `IN` | 在集合中 |
| `NOT_IN` | 不在集合中（2.0.0+） |
| `NULL` | 为空 |
| `NOT_NULL` | 不为空 |

**在 `beforeFetch` 中使用示例：**

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // 过滤掉特定状态
    conditions.add(new Condition("status", "deleted", QueryExpression.NOT_IN));
    return null;
}
```
