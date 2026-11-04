# 排序 @OrderBy

`@OrderBy` 用于定义数据的默认排序规则，参照 HQL 语句 order by 语法。

## 使用方式

- 单字段排序：`类名.字段名 [asc|desc]`
- 多字段排序：`类名.字段名 [asc|desc], 类名.字段名 [asc|desc] ...`

```java
@Erupt(
       name = "Erupt",
       orderBy = "EruptTest.no desc"
)
public class EruptTest extends BaseModel {
    
    @EruptField(
            views = @View(title = "编号"),
            edit = @Edit(title = "编号")
    )
    private Integer no;
    
}
```

## 关键点

- **`orderBy` 属性**：在 `@Erupt` 注解中设置，用于定义默认的排序行为
- **限定类名**：为了避免在多表查询时出现字段名冲突，排序字段前必须指定其所属的类名（如 `EruptTest.no`）
- **排序方向**：`asc` 表示升序（默认），`desc` 表示降序
