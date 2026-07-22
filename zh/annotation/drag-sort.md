# 行拖拽排序 @DragSort <Badge type="tip" text="2.0.4+" />

`@DragSort` 用于在 `@Erupt` 注解中开启表格行拖拽排序能力。通过 `field` 指定一个数值型排序字段后，表格支持直接拖拽行来调整顺序，拖拽结果自动持久化到该字段；未指定其他排序时，该字段将作为默认查询排序。

## 使用方式

```java
@Erupt(
    name = "字典项",
    dragSort = @DragSort(field = "sort")
)
public class DictItem extends BaseModel {

    @EruptField(
        views = @View(title = "排序", sortable = true)
    )
    private Integer sort;

}
```

## 注解配置项说明

| 属性名 | 描述 |
| --- | --- |
| `field` | 存储行顺序值的数值型字段名，非空时开启拖拽排序 |

## 注解文件定义

```java
public @interface DragSort {

    String field(); // 存储行顺序值的数值型字段，非空时开启拖拽排序

}
```

## 关键点

- **数值型字段**：`field` 指向的字段必须为数值类型（如 `Integer`），用于持久化行顺序
- **自动持久化**：拖拽行后，框架自动将新顺序写入该字段，无需额外编码
- **默认排序**：未通过 `orderBy` 或其他方式指定排序时，该字段将作为默认查询排序

:::tip
新增数据时可通过 `DataProxy.beforeAdd` 初始化排序值，框架内置的角色、字典项等功能均已启用该能力。
:::
