# 核心 @Erupt

## 使用方法

在类定义中增加 `@Erupt` 注解即可：

```java
@Erupt(
       name = "Erupt",              // 功能名称
       desc = "Erupt Engine",   // 描述
       orderBy = "id desc",        // 排序表达式
       .....
)
public class EruptTest extends BaseModel {
    
    // TODO
    
}
```

## 注解配置项说明

| 属性名 | 描述 |
| --- | --- |
| `primaryKeyCol` | 主键列名称，默认值为 id |
| `name` | 功能名称 |
| `desc` | 功能描述 |
| `layout` | 配置页面布局相关属性，详见 [@Layout](/zh/annotation/layout) |
| `authVerify` | 访问是否需要授权校验 |
| `orderBy` | 排序规则，参照 HQL 语句 order by 语法，详见 [@OrderBy](/zh/annotation/order-by) |
| `power` | 控制增删改查导入导出功能，详见 [@Power](/zh/annotation/power) |
| `filter` | 数据展示过滤条件，参照 HQL 语句 where 语法，详见 [@Filter](/zh/annotation/filter) |
| `tree` | 树节点配置，详见 [@Tree](/zh/annotation/tree) |
| `linkTree` | 左树右表配置，详见 [@LinkTree](/zh/annotation/link-tree) |
| `drills` | 自定义下钻关联视图，详见 [@Drill](/zh/annotation/drill) |
| `rowOperation` | 自定义功能按钮，详见 [@RowOperation](/zh/annotation/row-operation) |
| `dataProxy` | 服务层逻辑扩展（扩展已有逻辑），详见 [DataProxy](/zh/advanced/data-proxy) |
| `dataProxyParams` | 自定义参数，可在 `dataProxy` 内通过 `DataProxyContext.get()` 获取 |
| `visRawTable` | 是否保留默认表格视图，默认 `true`；设为 `false` 时仅显示 `vis` 中定义的视图 |
| `vis` | 附加视图配置（卡片、甘特图、看板等），详见 [@Vis 多视图](/zh/annotation/vis) |
| `param` | 自定义参数 |
| `prompt` | AI 智能体提示词，供 erupt-ai 工具调用时注入上下文，2.0.0 新增 |
| `dragSort` | 表格行拖拽排序配置，详见下方 [行拖拽排序](#drag-sort)，2.0.4 新增 |

## 注解文件定义

```java
public @interface Erupt {

    String primaryKeyCol() default "id"; // 主键列名称，默认值为id

    String name(); // 功能名称

    String desc() default ""; // 功能描述

    boolean authVerify() default true; // 访问是否需要授权校验

    Power power() default @Power; // 控制增删改查导入导出功能

    RowOperation[] rowOperation() default {}; // 自定义操作按钮

    Drill[] drills() default {}; // 自定义下钻关联视图

    Filter[] filter() default {}; // 数据过滤

    String orderBy() default ""; // 排序

    Class<? extends DataProxy>[] dataProxy() default {}; // 代理回调接口方法集

    String[] dataProxyParams() default {}; // 可在 dataProxy 内通过 DataProxyContext.get() 获取

    Tree tree() default @Tree; // 树节点配置

    LinkTree linkTree() default @LinkTree(field = ""); // 左树右表配置

    Layout layout() default @Layout; // 页面布局配置

    KV[] param() default {}; // 自定义参数

    String prompt() default ""; // AI 智能体提示词（2.0.0+）

    DragSort dragSort() default @DragSort(field = ""); // 行拖拽排序配置（2.0.4+）
}
```

## 行拖拽排序 @DragSort <Badge type="tip" text="2.0.4+" /> {#drag-sort}

通过 `dragSort` 指定一个数值型排序字段后，表格支持直接拖拽行来调整顺序，拖拽结果自动持久化到该字段；未指定其他排序时，该字段将作为默认查询排序。

```java
@Erupt(
    name = "字典项",
    dragSort = @DragSort(field = "sort")
)
public class DictItem extends BaseModel {

    @EruptField(
        views = @View(title = "排序", sortable = true),
        edit = @Edit(title = "排序", numberType = @NumberType)
    )
    private Integer sort;

}
```

:::tip
新增数据时可通过 `DataProxy.beforeAdd` 初始化排序值，框架内置的角色、字典项等功能均已启用该能力。
:::
