# 布局定义 @Layout

**版本支持**：`1.12.0` 及以上版本

`@Layout` 注解用于定义页面的布局、分页方式、列固定等 UI 行为。

## 代码示例

```java
@Erupt(
       name = "Erupt",
       orderBy = "EruptTest.no desc",
       layout = @Layout(
           // 固定前三列
           tableLeftFixed = 3, 
           // 使用前端分页
           pagingType = Layout.PagingType.FRONT,
           // 每页显示 20 条数据
           pageSize = 20
        )
)
public class EruptTest extends BaseModel {
    
}
```

## 注解定义与属性说明

```java
public @interface Layout {

    // 表单大小
    FormSize formSize() default FormSize.DEFAULT;

    // 表格左侧列固定数量
    int tableLeftFixed() default 0;

    // 表格右侧列固定数量
    int tableRightFixed() default 0;

    // 分页方式
    PagingType pagingType() default PagingType.BACKEND;

    // 分页大小
    int pageSize() default 10;

    // 可选分页数
    int[] pageSizes() default {10, 20, 30, 50, 100, 300, 500};

    // 页面数据更新时间，单位：毫秒 1.12.13 及以上版本支持
    int refreshTime() default -1;

    // 表格总宽度，不配置则根据字段数量自动计算 1.12.20 及以上版本支持
    // 配置示例 tableWidth = "1000px"
    String tableWidth() default "";

    // 表格操作区宽度，不配置则根据字段数量自动计算 1.12.21 及以上版本支持
    // 配置示例 tableOperatorWidth = "100px"
    String tableOperatorWidth() default "";

    enum FormSize {
        // 默认布局，每行显示三个表单组件
        DEFAULT, 
        // 整行布局，每行显示一个表单组件
        FULL_LINE
    }

    enum PagingType {
        // 后端分页
        BACKEND,
        // 前端分页
        FRONT,
        // 不分页，最多显示：pageSizes[pageSizes.length - 1] * 10 条
        NONE
    }

}
```

## FormSize

用于控制表单组件的布局方式：

- **`DEFAULT`**：默认布局，每行最多显示三个表单组件
- **`FULL_LINE`**：整行布局，每行只显示一个表单组件，使其占据整行宽度

## PagingType

用于定义表格的分页方式：

- **`BACKEND`**：后端分页（默认），每次翻页时向服务器请求数据
- **`FRONT`**：前端分页，一次性加载所有数据到前端，由前端处理分页逻辑
- **`NONE`**：不分页

## 列固定（Fixed Columns）

通过 `tableLeftFixed` 和 `tableRightFixed` 属性可以锁定表格左右两侧的列，使其在水平滚动时保持可见，提升数据查看体验。

<!-- TODO: 添加截图 -->
