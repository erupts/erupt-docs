# 甘特图、卡片视图

> 将 erupt 的数据通过甘特图、卡片的方式展示，实现多样性展示。
>
> **1.13.2 及以上版本支持**

## 甘特视图

<!-- TODO: 添加截图 -->

```java
@Entity
@Table(name = "t_gantt")
@Erupt(
    name = "Gantt",
    visRawTable = false,
    vis = {
        @Vis(
            title = "甘特图",
            desc = "Gantt",
            fieldVisibility = Vis.FieldVisibility.INCLUDE,
            fields = {"name", "type", "color", "progress"},
            ganttView = @GanttView(
                startDateField = "startDate",
                endDateField = "endDate",
                pidField = "parent.id",
                colorField = "color",
                progressField = "progress",
                groupField = "type"
            ),
            type = Vis.Type.GANTT
        )
    }
)
@AllowModify
public class GanttDemo extends BaseModel {

    @EruptField(
        views = @View(title = "名称"),
        edit = @Edit(title = "名称", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "分组"),
        edit = @Edit(title = "分组", type = EditType.CHOICE, choiceType = @ChoiceType(vl = {
            @VL(label = "分组1", value = "1"),
            @VL(label = "分组2", value = "2"),
            @VL(label = "分组1", value = "3"),
            @VL(label = "分组2", value = "4")
        }))
    )
    private String type;

    @EruptField(
        views = @View(title = "开始时间", sortable = true),
        edit = @Edit(title = "开始时间", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "结束时间", sortable = true),
        edit = @Edit(title = "结束时间", notNull = true)
    )
    private Date endDate;

    @EruptField(
        views = @View(title = "颜色"),
        edit = @Edit(title = "颜色", type = EditType.COLOR)
    )
    private String color;

    @EruptField(
        views = @View(title = "进度"),
        edit = @Edit(title = "进度", type = EditType.SLIDER, sliderType = @SliderType(max = 100))
    )
    private Integer progress;

    // 注意，必须将 parent.id 列暴露给前端，否则前端会无法生成树节点
    @ManyToOne
    @EruptField(
        views = @View(title = "pid", column = "id", show = false),
        edit = @Edit(
            title = "上级树节点",
            type = EditType.REFERENCE_TREE,
            referenceTreeType = @ReferenceTreeType(pid = "parent.id", expandLevel = 2)
        )
    )
    private GanttDemo parent;
}
```

### GanttView 注解定义

```java
public @interface GanttView {

    // 开始时间字段
    String startDateField();

    // 结束时间字段
    String endDateField();

    // 分组字段
    String groupField() default "";

    // 上级节点字段（必须在对应字段中通过 view 注解将 id 暴露给前端：@View(title = "pid", column = "id", show = false)）
    String pidField() default "";

    // 进度字段，数值区间：0 ~ 100
    String progressField() default "";

    // 颜色字段，格式：hex2rgb
    String colorField() default "";
}
```

## 卡片视图

<!-- TODO: 添加截图 -->

```java
@Entity
@Table(name = "t_card")
@Erupt(
    name = "Card",
    visRawTable = false,
    vis = {
        @Vis(
            title = "卡片视图",
            desc = "Description",
            cardView = @CardView(coverField = "img"),
            type = Vis.Type.CARD
        )
    }
)
@AllowModify
public class CardDemo extends BaseModel {

    @EruptField(
        views = @View(title = "封面图", sortable = true),
        edit = @Edit(title = "封面图", type = EditType.ATTACHMENT,
            attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
    )
    private String img;

    @EruptField(
        views = @View(title = "开始时间", sortable = true),
        edit = @Edit(title = "开始时间", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "结束时间", sortable = true),
        edit = @Edit(title = "结束时间", notNull = true)
    )
    private Date endDate;
}
```

### CardView 注解定义

```java
public @interface CardView {

    CoverEffect coverEffect() default CoverEffect.CLIP;

    String coverField() default "";

    enum CoverEffect {
        FIT,  // 适应
        CLIP, // 剪裁
    }
}
```

## 注解定义

### @Erupt 多视图相关属性

```java
public @interface Erupt {

    // 是否展示原始表格
    boolean visRawTable() default true;

    // 多视图配置，支持配置多个
    Vis[] vis() default {};
}
```

### @Vis 注解定义

```java
public @interface Vis {

    String code() default "";

    // 可视化标题
    String title();

    // 描述
    String desc() default "";

    /**
     * fields 可见性方式
     * EXCLUDE 从已有字段中排除
     * INCLUDE 只包含配置的字段
     */
    FieldVisibility fieldVisibility() default FieldVisibility.EXCLUDE;

    // 需要显示或排除的字段（依据 View 注解配置）
    String[] fields() default {};

    // 视图类型
    Type type() default Type.TABLE;

    // 卡片视图配置
    CardView cardView() default @CardView();

    // 甘特视图配置
    GanttView ganttView() default @GanttView(startDateField = "", endDateField = "");

    // 自定义视图配置
    Tpl tplView() default @Tpl(enable = false, path = "");

    enum Type {
        TABLE,  // 表格视图
        GANTT,  // 甘特视图
        CARD,   // 卡片视图
        TPL     // 模板视图
    }
}
```
