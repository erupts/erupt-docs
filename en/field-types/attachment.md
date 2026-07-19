# File Upload ATTACHMENT

Supports uploading images and arbitrary files. You can restrict file type, size, and count, and the storage path is customizable.

![attachment](/field-types/attachment.png)
![attachment-image](/field-types/attachment-image.png)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Attachment"),
    edit = @Edit(title = "Attachment", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType)
)
private String attachment;
```

> Before use, configure `erupt.uploadPath` in `application.yml` to specify the physical storage path.  
> To integrate with OSS or other cloud storage, see [Custom File Upload](/en/advanced/upload).

## Configuration

```java
public @interface AttachmentType {

    long size() default -1;          // File size limit in KB; -1 means unlimited

    String path() default "";        // Storage sub-path

    String[] fileTypes() default {}; // Allowed file extensions; empty means unrestricted

    Type type() default Type.BASE;   // Upload type

    int maxLimit() default 1;        // Maximum number of files to upload

    ImageType imageType() default @ImageType;

    String fileSeparator() default "|"; // Separator for multiple file paths

    enum Type {
        BASE,  // Any file
        IMAGE, // Image (enables image cropping / width-height constraints)
    }

    @interface ImageType {
        int minWidth() default 0;              // Minimum width
        int maxWidth() default Integer.MAX_VALUE; // Maximum width
        int minHeight() default 0;             // Minimum height
        int maxHeight() default Integer.MAX_VALUE; // Maximum height
    }

}
```

## Examples

Image upload (up to 3 images):

```java
@EruptField(
    views = @View(title = "Image"),
    edit = @Edit(title = "Image", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(type = AttachmentType.Type.IMAGE, maxLimit = 3))
)
private String pic;
```

Restrict uploads to PDF only:

```java
@EruptField(
    edit = @Edit(title = "PDF File", type = EditType.ATTACHMENT,
                 attachmentType = @AttachmentType(fileTypes = {"pdf"}))
)
private String pdf;
```
