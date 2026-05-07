# 分割线 DIVIDE

在表单中插入一条横向分割线，用于字段的视觉分组，不存储任何数据。

## 基础用法

```java
@Transient
@EruptField(
    edit = @Edit(title = "-- 基本信息 --", type = EditType.DIVIDE)
)
private String divide;
```
