# 签名板 SIGNATURE

手写签名输入组件，内容以 Base64 图片格式存储，适用于审批签字等场景。

**版本要求**：1.13.1+

## 基础用法

```java
@EruptField(
    views = @View(title = "签名", type = ViewType.IMAGE_BASE64),
    edit = @Edit(title = "签名", type = EditType.SIGNATURE)
)
private String signature;
```

> 列表展示时使用 `ViewType.IMAGE_BASE64` 将 Base64 内容渲染为图片。
