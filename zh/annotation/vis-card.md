# 卡片视图 CARD

以卡片形式展示数据，支持配置封面图片字段，可选网格或瀑布流布局。配合 `@Vis(type = Vis.Type.CARD)` 使用。

![卡片视图：封面图与字段](/annotation/vis-card.png)

## 完整示例

```java
@Entity
@Table(name = "t_card")
@Erupt(
    name = "卡片演示",
    visRawTable = false,
    vis = {
        @Vis(
            title = "卡片视图",
            type = Vis.Type.CARD,
            cardView = @CardView(coverField = "img")
        )
    }
)
public class CardDemo extends BaseModel {

    @EruptField(
        views = @View(title = "封面图"),
        edit = @Edit(title = "封面图", type = EditType.ATTACHMENT,
            attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
    )
    private String img;

    @EruptField(
        views = @View(title = "开始时间"),
        edit = @Edit(title = "开始时间", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "结束时间"),
        edit = @Edit(title = "结束时间", notNull = true)
    )
    private Date endDate;

}
```

## 瀑布流布局 <Badge type="tip" text="v2.4.0+" />

`layout = CardView.Layout.MASONRY` 时，每张卡片按封面图自身的比例完整显示，卡片按列错落排布，适合竖图、横图混排的图片类数据。默认的 `GRID` 则把卡片裁成统一尺寸逐行对齐。

```java
@Vis(
    title = "瀑布流",
    type = Vis.Type.CARD,
    cardView = @CardView(coverField = "img", layout = CardView.Layout.MASONRY)
)
```

![卡片视图：瀑布流布局](/annotation/vis-card-masonry.png)

瀑布流布局下 `coverEffect` 不生效，封面始终完整显示。

## @CardView 属性说明

```java
public @interface CardView {

    String coverField() default ""; // 封面图片字段名

    CoverEffect coverEffect() default CoverEffect.CLIP; // 图片填充方式，MASONRY 布局下忽略

    Layout layout() default Layout.GRID; // 卡片布局

    enum Layout {
        GRID,    // 网格：卡片等大逐行对齐（默认）
        MASONRY, // 瀑布流：保留封面原始高度，按列错落排布
    }

    enum CoverEffect {
        FIT,  // 等比适应
        CLIP, // 居中裁剪（默认）
    }

}
```

| 属性名 | 描述 |
|--------|------|
| `coverField` | 用作封面的图片字段名，对应 `ATTACHMENT` 类型字段 |
| `coverEffect` | 封面图片填充方式：`CLIP` 居中裁剪（默认）/ `FIT` 等比适应；`MASONRY` 布局下忽略 |
| `layout` | 卡片布局：`GRID` 网格（默认）/ `MASONRY` 瀑布流 |
