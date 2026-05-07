# 多对一表引用 REFERENCE_TABLE

通过弹出表格的方式选择关联数据，适用于多对一（`@ManyToOne`）关系。

<!-- TODO: 添加截图 -->

## 使用方法

```java
@ManyToOne // 多对一
@JoinColumn(name = "table")
@EruptField(
    views = {
        @View(title = "顺序", column = "sort"),
        @View(title = "名称", column = "name")
    },
    edit = @Edit(title = "多对一表格", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(id = "id", label = "name")
    )
)
private Table table;
```

被引用的类定义：

```java
@Entity
@Table(name = "TABLE")
@Erupt(name = "表格")
public class Table extends BaseModel {
    
    @EruptField(
            views = @View(title = "顺序"),
            edit = @Edit(title = "顺序")
    )
    private Integer sort;

    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

## 配置项注解定义

```java
public @interface ReferenceTableType {
    String id() default "id"; // 多对一表中做存储的列

    String label() default "name"; // 多对一表中做展示的列

    String dependField() default ""; // 使根据依赖字段的值做匹配

    /**
     * 指定依赖对象中用于与当前修饰对象主键建立关联的字段。
     * 编译结果示例：dependClass.<dependColumn> = field.primaryKey
     */
    String dependColumn() default "id";
}
```

## 联动使用

通过 `dependField` 和 `dependColumn` 实现级联选择，例如省市区三级联动：

```java
@ManyToOne
@JoinColumn(name = "province_id")
@EruptField(
    views = @View(title = "省", column = "name"),
    edit = @Edit(title = "省", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(id = "id", label = "name"))
)
private Province province;

@ManyToOne
@JoinColumn(name = "city_id")
@EruptField(
    views = @View(title = "市", column = "name"),
    edit = @Edit(title = "市", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(
            id = "id", label = "name",
            dependField = "province",  // 依赖的字段名
            dependColumn = "province.id"  // 依赖对象中的关联字段
        ))
)
private City city;
```
