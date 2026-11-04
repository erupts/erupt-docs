# 查询条件控制（beforeFetch / searchCondition）

通过 `beforeFetch` 与 `searchCondition` 控制数据查询行为：前者在查询前动态注入过滤条件，后者为搜索框预设默认值。

## beforeFetch 条件注入

`beforeFetch` 返回值为 JPQL（HQL）的 WHERE 子句，**不包含 `WHERE` 关键字**，框架会自动拼接。

```java
@Override
public String beforeFetch(List<Condition> conditions) {
    // 只查询当前登录用户自己的数据
    String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
    return "createBy = '" + currentUser + "'";
}
```

支持的语法示例：

| 场景 | 返回值示例 |
| --- | --- |
| 等于 | `"status = 1"` |
| 范围 | `"age between 18 and 60"` |
| 模糊 | `"name like '%张%'"` |
| IN | `"id in (1, 2, 3)"` |
| 关联属性 | `"dept.id = 10"` |
| 多条件 | `"status = 1 and deleteFlag = 0"` |
| 子查询 | `"id in (select userId from t_order where amount > 100)"` |

> 注意：这里是 JPQL 而非原生 SQL，字段名应使用 Java 实体属性名（驼峰），而非数据库列名。

## searchCondition 搜索默认值

页面加载时触发，可为搜索框预设默认值。Map 的 key 为实体字段名，value 为默认搜索值。

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void searchCondition(Map<String, Object> condition) {
        // 默认筛选当前登录用户的数据
        condition.put("createBy", getCurrentUser());
        // 默认状态为"启用"
        condition.put("status", 1);
    }
}
```
