# 文件上传 ATTACHMENT

支持图片、任意文件上传，可限制文件类型、大小和数量，存储路径可自定义。

## 基础用法

```java
@EruptField(
    views = @View(title = "附件"),
    edit = @Edit(title = "附件", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType)
)
private String attachment;
```

> 使用前需在 `application.yml` 中配置 `erupt.uploadPath`，指定文件的物理存储路径。  
> 如需对接 OSS 等云存储，参见 [自定义文件上传](/advanced/upload)。

## 配置项

```java
public @interface AttachmentType {

    long size() default -1;          // 文件大小限制（KB），-1 表示不限制

    String path() default "";        // 存储子路径

    String[] fileTypes() default {}; // 允许的文件扩展名，不填表示不限制

    Type type() default Type.BASE;   // 上传类型

    int maxLimit() default 1;        // 最多上传数量

    ImageType imageType() default @ImageType;

    String fileSeparator() default "|"; // 多文件路径分隔符

    enum Type {
        BASE,  // 任意文件
        IMAGE, // 图片（启用图片裁剪/限制宽高）
    }

    @interface ImageType {
        int minWidth() default 0;              // 最小宽度
        int maxWidth() default Integer.MAX_VALUE; // 最大宽度
        int minHeight() default 0;             // 最小高度
        int maxHeight() default Integer.MAX_VALUE; // 最大高度
    }

}
```

## 示例

图片上传（最多 3 张）：

```java
@EruptField(
    views = @View(title = "图片"),
    edit = @Edit(title = "图片", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
)
private String pic;
```

限定只能上传 PDF：

```java
@EruptField(
    edit = @Edit(title = "PDF 文件", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(fileTypes = {"pdf"}))
)
private String pdf;
```
