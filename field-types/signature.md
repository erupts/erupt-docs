# 签名板 SIGNATURE

**版本支持**：1.13.1 及以上版本

用于审批签字等场景。

```java
@EruptField(
    views = @View(title = "签名", type = ViewType.IMAGE_BASE64),
    edit = @Edit(title = "签名", type = EditType.SIGNATURE)
)
private String signature;
```
