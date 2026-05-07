# 核心 @Erupt

## 使用方法

在类定义中增加 `@Erupt` 注解即可：

```java
@Erupt(
       name = "Erupt",              // 功能名称
       desc = "Erupt Framework",   // 描述
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
| `layout` | 配置页面布局相关属性，详见 [@Layout](/annotation/layout) |
| `authVerify` | 访问是否需要授权校验 |
| `orderBy` | 排序规则，参照 HQL 语句 order by 语法，详见 [@OrderBy](/annotation/order-by) |
| `power` | 控制增删改查导入导出功能，详见 [@Power](/annotation/power) |
| `filter` | 数据展示过滤条件，参照 HQL 语句 where 语法，详见 [@Filter](/annotation/filter) |
| `tree` | 树节点配置，详见 [@Tree](/annotation/tree) |
| `linkTree` | 左树右表配置，详见 [@LinkTree](/annotation/link-tree) |
| `drills` | 自定义下钻关联视图，详见 [@Drill](/annotation/drill) |
| `rowOperation` | 自定义功能按钮，详见 [@RowOperation](/annotation/row-operation) |
| `dataProxy` | 服务层逻辑扩展（扩展已有逻辑），详见 [DataProxy](/advanced/data-proxy) |
| `param` | 自定义参数 |

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

    Tree tree() default @Tree; // 树节点配置

    LinkTree linkTree() default @LinkTree(field = ""); // 左树右表配置

    KV[] param() default {}; // 自定义参数
}
```
