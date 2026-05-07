# 一对一新增 COMBINE

在主表编辑界面同时管理一对一关联表数据的组件，支持 JSON 字段存储。

**版本支持**：1.11.4 及以上版本

<!-- TODO: 添加截图 -->

## 基础使用

```java
// 注意：JoinColumn 暂不支持 referencedColumnName 配置
@OneToOne(cascade = CascadeType.ALL)
@JoinColumn
@EruptField(
    views = @View(title = "扩展表姓名", column = "name"),
    edit = @Edit(title = "扩展表定义", type = EditType.COMBINE)
)
private DemoExt ext;
```

扩展表定义：

```java
@Erupt(name = "一对一扩展表")
@Table(name = "demo_ext")
@Entity
public class DemoExt extends BaseModel {

    @EruptField(
            views = @View(title = "姓名"),
            edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;

    @EruptField(
            views = @View(title = "性别"),
            edit = @Edit(title = "性别",
                    boolType = @BoolType(trueText = "男", falseText = "女"))
    )
    private Boolean sex;

}
```

## 一对一对象存储到 JSON 字段

参考：[一对多新增 TAB_TABLE_ADD（支持 JSON 字段存储）](/field-types/tab-table-add)，COMBINE 组件同样支持将一对一数据存储为 JSON 格式。
