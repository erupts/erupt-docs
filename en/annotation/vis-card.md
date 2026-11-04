# Card View CARD

Displays data as cards, with optional cover images, in a grid or masonry layout. Used with `@Vis(type = Vis.Type.CARD)`.

![CARD view: cover images and fields](/annotation/vis-card.png)

## Complete Example

```java
@Entity
@Table(name = "t_card")
@Erupt(
    name = "Card Demo",
    visRawTable = false,
    vis = {
        @Vis(
            title = "Card View",
            type = Vis.Type.CARD,
            cardView = @CardView(coverField = "img")
        )
    }
)
public class CardDemo extends BaseModel {

    @EruptField(
        views = @View(title = "Cover Image"),
        edit = @Edit(title = "Cover Image", type = EditType.ATTACHMENT,
            attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
    )
    private String img;

    @EruptField(
        views = @View(title = "Start Date"),
        edit = @Edit(title = "Start Date", notNull = true)
    )
    private Date startDate;

    @EruptField(
        views = @View(title = "End Date"),
        edit = @Edit(title = "End Date", notNull = true)
    )
    private Date endDate;

}
```

## Masonry Layout <Badge type="tip" text="v2.4.0+" />

With `layout = CardView.Layout.MASONRY`, each card shows its whole cover at the image's own aspect ratio, and cards are packed into staggered columns. This suits image data that mixes portrait and landscape pictures. The default `GRID` crops cards to one size and lines them up in rows.

```java
@Vis(
    title = "Masonry",
    type = Vis.Type.CARD,
    cardView = @CardView(coverField = "img", layout = CardView.Layout.MASONRY)
)
```

![CARD view: masonry layout](/annotation/vis-card-masonry.png)

`coverEffect` has no effect in the masonry layout; the cover is always shown whole.

## @CardView Attributes

```java
public @interface CardView {

    String coverField() default ""; // cover image field name

    CoverEffect coverEffect() default CoverEffect.CLIP; // image fill mode, ignored by MASONRY

    Layout layout() default Layout.GRID; // card layout

    enum Layout {
        GRID,    // equal-size cards lined up in rows (default)
        MASONRY, // keeps each cover's own height, packs cards into columns
    }

    enum CoverEffect {
        FIT,  // fit proportionally
        CLIP, // center crop (default)
    }

}
```

| Attribute | Description |
|-----------|-------------|
| `coverField` | The field name to use as the cover image; must be an `ATTACHMENT` type field |
| `coverEffect` | Cover image fill mode: `CLIP` — center crop (default) / `FIT` — fit proportionally; ignored by `MASONRY` |
| `layout` | Card layout: `GRID` (default) / `MASONRY` |
