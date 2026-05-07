# 多对一表引用 REFERENCE_TABLE

弹出表格供用户选择关联记录，对应 JPA `@ManyToOne` 关系。适合被关联数据以列表形式展示的场景。

## 基础用法

```java
@ManyToOne
@JoinColumn(name = "table_id")
@EruptField(
    views = {
        @View(title = "顺序", column = "sort"),
        @View(title = "名称", column = "name")
    },
    edit = @Edit(title = "关联表格", type = EditType.REFERENCE_TABLE,
        referenceTableType = @ReferenceTableType(id = "id", label = "name")
    )
)
private Table table;
```

被引用的实体类：

```java
@Entity
@Table(name = "t_table")
@Erupt(name = "表格")
public class Table extends BaseModel {

    @EruptField(views = @View(title = "顺序"), edit = @Edit(title = "顺序"))
    private Integer sort;

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称"))
    private String name;

}
```

## 配置项

```java
public @interface ReferenceTableType {

    String id() default "id";       // 关联表中用于存储的字段（主键）

    String label() default "name";  // 关联表中用于展示的字段

    String dependField() default ""; // 依赖的本表字段名，用于级联

    String dependColumn() default "id"; // 依赖字段中用于匹配的列

}
```

## 示例：省市区级联

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
            dependField = "province",
            dependColumn = "province.id"
        ))
)
private City city;
```
