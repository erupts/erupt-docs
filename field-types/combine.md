# 一对一新增 COMBINE

在主表编辑弹窗中同时管理一对一关联表的数据，对应 JPA `@OneToOne`，支持将关联对象存储为 JSON 字段。

**版本要求**：1.11.4+

## 基础用法

```java
@OneToOne(cascade = CascadeType.ALL)
@JoinColumn
@EruptField(
    views = @View(title = "扩展姓名", column = "name"),
    edit = @Edit(title = "扩展信息", type = EditType.COMBINE)
)
private DemoExt ext;
```

> **注意**：`@JoinColumn` 暂不支持 `referencedColumnName` 配置。

扩展表实体类：

```java
@Entity
@Table(name = "demo_ext")
@Erupt(name = "扩展信息")
public class DemoExt extends BaseModel {

    @EruptField(views = @View(title = "姓名"), edit = @Edit(title = "姓名", notNull = true))
    private String name;

    @EruptField(
        views = @View(title = "性别"),
        edit = @Edit(title = "性别", boolType = @BoolType(trueText = "男", falseText = "女"))
    )
    private Boolean sex;

}
```

## 示例：存储为 JSON 字段

用法与 [TAB_TABLE_ADD](/field-types/tab-table-add) 的 JSON 存储方式相同，将 `@OneToOne` 改为对应的 JSON 注解即可。
