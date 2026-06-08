# Card View CARD

Displays data as a grid of cards, with optional cover image support. Used with `@Vis(type = Vis.Type.CARD)`.

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

## @CardView Attributes

```java
public @interface CardView {

    String coverField() default ""; // cover image field name

    CoverEffect coverEffect() default CoverEffect.CLIP; // image fill mode

    enum CoverEffect {
        FIT,  // fit proportionally
        CLIP, // center crop (default)
    }

}
```

| Attribute | Description |
|-----------|-------------|
| `coverField` | The field name to use as the cover image; must be an `ATTACHMENT` type field |
| `coverEffect` | Cover image fill mode: `CLIP` — center crop (default) / `FIT` — fit proportionally |
