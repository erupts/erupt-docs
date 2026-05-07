# 文件上传 ATTACHMENT

<!-- TODO: 添加截图 -->

## 使用说明

1. 使用需确认 application.yml 中是否存在 `erupt.uploadPath` 属性，该属性表示附件存储的实际物理位置
2. 附件存储路径为：上传日期 + 随机字符串 + 格式 → /2020-11-15/tpq1l9.png
3. 想更改命名规则详见：[自定义附件上传规则](/advanced/upload)
4. 不希望将图片存储于本地磁盘中详见：[自定义附件上传规则](/advanced/upload)

## 使用方法

```java
@EruptField(
    views = @View(title = "文件上传"),
    edit = @Edit(title = "文件上传", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType)
)
private String attachment;
```

## 配置项注解定义

```java
public @interface AttachmentType {

    long size() default 0; // 上传文件大小限制

    String path() default ""; // 文件存储附加路径

    String[] fileTypes() default {}; // 允许上传的文件类型，不填表示允许任何类型

    Type type() default Type.OTHER; // 上传方式

    int maxLimit() default 1; // 上传数量限制

    ImageType imageType() default @ImageType;

    String fileSeparator() default "|"; // 多图片上传路径的分隔字符

    enum Type {
        BASE,  // 可上传任意文件
        IMAGE, // 图片上传
    }

    @interface ImageType {
        // 宽高使用长度为2的数组，第一位是最小宽高限制，第二位是最大宽高限制
        int[] width() default {};
        int[] height() default {};
    }

}
```

## 代码演示

图片上传：

```java
@EruptField(
    views = @View(title = "图片"),
    edit = @Edit(title = "图片", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
)
private String pic;
```

上传 PDF：

```java
@EruptField(
    edit = @Edit(title = "上传PDF文件", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(fileTypes = "pdf"))
)
private String pdf;
```
