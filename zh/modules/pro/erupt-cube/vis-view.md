# 模型视图图表 <Badge type="tip" text="v2.4.0+" />

除了独立的看板与探索页，cube 的图表也可以直接放进任意 Erupt 模型的视图 Tab：用 `@Vis(type = Vis.Type.CUBE)` 在代码里声明一组图表，和表格、看板、地图等视图一起切换。列表当前的搜索条件会自动转为 cube 过滤条件，图表始终描述屏幕上正在筛选的那批数据。

![模型页面中的指标图表视图](/annotation/vis-cube.png)

## 与看板的区别

| | 可视化分析看板 | 模型视图图表 |
| --- | --- | --- |
| 定义方式 | 在页面上拖拽设计 | 在模型类上用注解声明，随代码版本管理 |
| 入口 | 独立菜单 | 业务模型页面的一个视图 Tab |
| 筛选 | 看板自身的筛选器 | 复用列表的搜索栏，搜什么图表就统计什么 |
| 适合 | 分析师自助分析、跨模型报表 | 业务页面自带的统计，例如订单页的销售概览 |

两者查询的是同一个 `@EruptCube` 语义模型，指标口径一致。

## 快速上手

最简单的做法是让模型自己同时也是一个 cube：在模型上加 `@EruptCube`，把需要统计的字段标为 `@Dimension` / `@Measure`，再声明一个 CUBE 视图。

```java
@Entity
@Table(name = "t_order")
@EruptCube(name = "订单分析", sql = "t_order", sqlType = SqlType.TABLE_NAME)
@Erupt(
    name = "订单",
    vis = @Vis(
        title = "图表",
        type = Vis.Type.CUBE,
        cubeView = @CubeView(charts = {
            @CubeChart(title = "销售额", type = CubeChart.Type.KPI, y = "amount"),
            @CubeChart(title = "各渠道销售额", type = CubeChart.Type.COLUMN, x = "channel", y = "amount"),
            @CubeChart(title = "销售趋势", type = CubeChart.Type.LINE, x = "createTime", y = "amount", span = 2)
        })
    )
)
public class Order extends BaseModel {

    @Dimension(title = "渠道")
    @EruptField(views = @View(title = "渠道"), edit = @Edit(title = "渠道", search = @Search))
    private String channel;

    @Dimension(title = "下单时间")
    @EruptField(views = @View(title = "下单时间"), edit = @Edit(title = "下单时间", search = @Search(vague = true)))
    private Date createTime;

    @Measure(title = "销售额", sql = "sum(amount)")
    @EruptField(views = @View(title = "金额"), edit = @Edit(title = "金额"))
    private Double amount;

}
```

图表也可以查询另一个单独的 cube 类：`@CubeView(cube = OrderCube.class, ...)`。

## 交互

- 列表搜索条件变化时，所有图表随之重新查询；被搜索的字段必须是 cube 的维度，字段名不一致时用 `searchMapping` 映射
- 点击图表元素（如柱状图的某一柱）会加上对应的等值过滤，以可删除的标签显示在视图上方
- 图表类型与看板中的报表类型一致：KPI、折线、柱状、饼图、透视表等

完整的 `@CubeView` / `@CubeChart` 属性见 [指标图表视图 CUBE](/zh/annotation/vis-cube)。
