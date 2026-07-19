# 多对一树引用 REFERENCE_TREE

弹出树形选择器供用户选择关联记录，对应 JPA `@ManyToOne` 关系。适合被关联数据具有层级结构的场景。

![reference-tree](/field-types/reference-tree.png)
![reference-tree-dialog](/field-types/reference-tree-dialog.png)

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

    /**
     * 根节点 pid 条件。默认情况下 pid 为 null 即为根节点；
     * 若需自定义根节点判断规则，可通过 @Expr 动态返回根节点 id。
     * 建议配合 filter 使用，避免将不必要的数据暴露给前端。
     */
    Expr rootPid() default @Expr;

    /**
     * 默认展开层级。待渲染数据量较大时，建议调低此值以加快渲染速度，
     * 支持渲染几十万节点的树形数据。
     */
    int expandLevel() default 999;

    String dependField() default ""; // 依赖的本表字段名，用于级联

    /**
     * 指定依赖对象中用于与当前字段建立关联的列。
     * 示例：dependClass.<dependColumn> = field.primaryKey
     */
    String dependColumn() default "id";

}
```

## 示例：省市区联动

### 第一步：定义地区实体

```java
@Entity
@Table(name = "demo_region")
@Erupt(name = "地区")
public class Region extends BaseModel {

    @EruptField(views = @View(title = "名称"))
    private String name;

    @EruptField(views = @View(title = "层级"))
    private Integer levels;

    @ManyToOne
    @JoinColumn(name = "pid")
    private Region pid;

}
```

表结构参考：

![地区表结构](/region/region-table.png)

### 第二步：使用 REFERENCE_TREE 实现联动

通过 `dependField` + `dependColumn` 建立字段间的级联依赖，配合 `@Filter` 按层级筛选数据：

```java
@Erupt(name = "test")
@Table(name = "demo_test")
@Entity
public class RegionLink extends BaseModel {

    @ManyToOne
    @JoinColumn(name = "province")
    @EruptField(
        views = @View(title = "省份", column = "name"),
        edit = @Edit(title = "省份", type = EditType.REFERENCE_TREE,
            filter = @Filter("Region.levels = 1"))
    )
    private Region province;

    @ManyToOne
    @JoinColumn(name = "city")
    @EruptField(
        views = @View(title = "市", column = "name"),
        edit = @Edit(title = "市", type = EditType.REFERENCE_TREE,
            filter = @Filter("Region.levels = 2"),
            referenceTreeType = @ReferenceTreeType(
                dependField = "province",
                dependColumn = "pid.id"
            ))
    )
    private Region city;

    @ManyToOne
    @JoinColumn(name = "area")
    @EruptField(
        views = @View(title = "区", column = "name"),
        edit = @Edit(title = "区", type = EditType.REFERENCE_TREE,
            filter = @Filter("Region.levels = 3"),
            referenceTreeType = @ReferenceTreeType(
                dependField = "city",
                dependColumn = "pid.id"
            ))
    )
    private Region area;
}
```

### 效果演示

![省市区联动演示](/region/linkage-demo.gif)

### 省市区数据库 SQL

数据截止于 2020 年 7 月 21 日，可按实际项目需求酌情使用：

[district.sql](https://www.yuque.com/attachments/yuque/0/2022/sql/117735/1646758293092-643ef5b5-9e65-485e-a9f8-4054d52b3589.sql)
