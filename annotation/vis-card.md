# 卡片视图 CARD

以网格卡片形式展示数据，支持配置封面图片字段。配合 `@Vis(type = Vis.Type.CARD)` 使用。

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

## @CardView 属性说明

```java
public @interface CardView {

    String coverField() default ""; // 封面图片字段名

    CoverEffect coverEffect() default CoverEffect.CLIP; // 图片填充方式

    enum CoverEffect {
        FIT,  // 等比适应
        CLIP, // 居中裁剪（默认）
    }

}
```

| 属性名 | 描述 |
|--------|------|
| `coverField` | 用作封面的图片字段名，对应 `ATTACHMENT` 类型字段 |
| `coverEffect` | 封面图片填充方式：`CLIP` 居中裁剪（默认）/ `FIT` 等比适应 |
