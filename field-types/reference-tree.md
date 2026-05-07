# 多对一树引用 REFERENCE_TREE

通过弹出树形选择器选择关联数据，适用于多对一（`@ManyToOne`）关系，且被引用的数据具有层级结构。

<!-- TODO: 添加截图 -->

## 使用方法

```java
@ManyToOne // 多对一
@JoinColumn(name = "tree_id")
@EruptField(
    edit = @Edit(
         title = "树引用", 
         type = EditType.REFERENCE_TREE,
         referenceTreeType = @ReferenceTreeType(
             id = "id", label = "name", 
             pid = "parent.id" // 如果不填pid，展示方式为列表
         )
    )
)
private Tree tree;
```

被引用的树类定义：

```java
@Entity
@Table(name = "TREE")
@Erupt(
        name = "树",
        tree = @Tree(pid = "parent.id")
)
public class Tree extends BaseModel {

    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;

    @ManyToOne
    @JoinColumn(name = "parent")
    @EruptField(
            edit = @Edit(
                    title = "上级树节点",
                    type = EditType.REFERENCE_TREE,
                    referenceTreeType = @ReferenceTreeType(pid = "parent.id")
            )
    )
    private Tree parent;

}
```

## 配置项注解定义

```java
public @interface ReferenceTreeType {
    String id() default "id";      // 多对一表中做存储的列

    String label() default "name"; // 多对一表中做展示的列

    String pid() default "";       // 上级id字段，如果不填，展示方式为列表

    Expr rootPid() default @Expr;

    int expandLevel() default 999; // 展开层级

    String dependField() default ""; // 依赖字段名称

    String dependColumn() default "id"; // 依赖字段关联列
}
```
