# 树形展示 @Tree

`@Tree` 注解用于将数据以树形结构展示，适用于具有层级关系的数据，如组织架构、分类目录等场景。

## 使用方法

```java
@Erupt(
       name = "Tree",
       tree = @Tree(id = "id", label = "name", pid = "parent.id", expandLevel = 1)
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

配置完成后启动项目，前往 系统管理 → 菜单维护 → 新增 → 菜单类型选择为树，类型值为类名称即可使用树视图！

## 配置项注解定义

```java
public @interface Tree {

    String id() default "id"; // 存储的列

    String label() default "name"; // 展示列

    String pid() default ""; // 为空则以列表方式渲染
    
    /**
     * 展开层级，如果待渲染的数据量过大建议调低展开层级，可快速渲染几十万的树节点
     */
    int expandLevel() default 999;

    /**
     * 如果上级节点id为null，erupt会认为是根节点，开始渲染树
     * 如果您想要改变这个规则就需要实现@Expr动态返回一个根节点的id
     * 建议与filter配合使用，要不然有可能返回给前端一些不需要渲染的值，导致数据泄露！
     */
    Expr rootPid() default @Expr;

    /**
     * 最大层级，根节点为第 1 级，0 表示不限制（2.3.0+）
     * 达到该层级的节点不再提供「添加子节点」，服务端同时拒绝任何会让节点更深的保存（新增、移动、单元格编辑改父级、导入、API）
     */
    int maxLevel() default 0;

}
```

## maxLevel 限制层级 <Badge type="tip" text="v2.3.0+" />

层级数据往往有业务上限——组织架构不超过三级、分类目录不超过两级。`maxLevel` 把这个上限交给框架执行：

```java
@Erupt(
        name = "部门",
        tree = @Tree(pid = "parent.id", maxLevel = 3)
)
public class Department extends BaseModel { ... }
```

- 根节点为第 1 级，`maxLevel = 3` 即最深只能到第 3 级；默认 `0` 表示不限制
- 已达上限的节点在树上不再显示「添加子节点」
- 服务端同步校验：新增、拖动移动、单元格编辑改父级、导入、直接调用 API，只要会让节点落到更深一层都会被拒绝

## 效果展示

![Tree 树形展示效果](/annotation/tree.png)
