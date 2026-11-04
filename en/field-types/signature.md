# Signature Pad SIGNATURE

A handwriting signature input component. Content is stored as a Base64-encoded image, suitable for scenarios such as approval sign-offs.

**Version requirement**: 1.13.1+

![signature](/field-types/signature.svg)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Signature", type = ViewType.IMAGE_BASE64),
    edit = @Edit(title = "Signature", type = EditType.SIGNATURE)
)
private String signature;
```

> When displaying in a list, use `ViewType.IMAGE_BASE64` to render the Base64 content as an image.
