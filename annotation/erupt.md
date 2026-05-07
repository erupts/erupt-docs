# @Erupt

`@Erupt` 注解标记在实体类上，声明该类为 Erupt 管理实体并配置列表页的全局行为。

## 常用属性

| 属性 | 类型 | 说明 |
|------|------|------|
| `name` | String | 菜单/页面名称 |
| `desc` | String | 页面描述 |
| `power` | Power | 权限控制（增删改查） |
| `dataProxy` | Class[] | 数据代理实现类 |
| `orderBy` | String | 默认排序字段 |
| `pageSize` | int | 每页显示条数 |

## 示例

```java
@Erupt(
    name = "商品管理",
    desc = "管理所有商品信息",
    orderBy = "createTime desc",
    power = @Power(add = true, edit = true, delete = true, export = true)
)
@Entity
@Table(name = "t_product")
public class Product extends BaseModel { ... }
```

::: tip
占位文档，更多属性说明待补充。
:::
