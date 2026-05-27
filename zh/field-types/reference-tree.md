# 多对一树引用 REFERENCE_TREE

弹出树形选择器供用户选择关联记录，对应 JPA `@ManyToOne` 关系。适合被关联数据具有层级结构的场景。

## 基础用法

```java
@ManyToOne
@JoinColumn(name = "tree_id")
@EruptField(
    edit = @Edit(
        title = "树引用",
        type = EditType.REFERENCE_TREE,
        referenceTreeType = @ReferenceTreeType(
            id = "id", label = "name",
            pid = "parent.id" // 不填 pid 则以列表形式展示
        )
    )
)
private Tree tree;
```

被引用的树实体类：

```java
@Entity
@Table(name = "t_tree")
@Erupt(name = "树", tree = @Tree(pid = "parent.id"))
public class Tree extends BaseModel {

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称"))
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent_id")
    @EruptField(
        edit = @Edit(title = "上级节点", type = EditType.REFERENCE_TREE,
                     referenceTreeType = @ReferenceTreeType(pid = "parent.id"))
    )
    private Tree parent;

}
```

## 配置项

```java
public @interface ReferenceTreeType {

    String id() default "id";       // 用于存储的字段

    String label() default "name";  // 用于展示的字段

    String pid() default "";        // 父节点字段，不填则以列表展示

    Expr rootPid() default @Expr;   // 根节点 pid 条件

    int expandLevel() default 999;  // 默认展开层级

    String dependField() default ""; // 依赖的本表字段名

    String dependColumn() default "id"; // 依赖字段中用于匹配的列

}
```
