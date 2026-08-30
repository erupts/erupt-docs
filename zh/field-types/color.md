# 颜色选择 COLOR

颜色拾取器，用户通过调色板选择颜色，值以十六进制字符串（如 `#ff0000`）存储。

![color](/field-types/color.png)

## 基础用法

```java
@EruptField(
    views = @View(title = "颜色"),
    edit = @Edit(title = "颜色", type = EditType.COLOR)
)
private String color;
```

## 配置项 <Badge type="tip" text="v2.1.1+" />

```java
public @interface ColorType {

    boolean alpha() default false; // 是否支持透明度（Alpha 通道）

    String[] presets() default {}; // 调色板预设色板，如 {"#F5222D", "#1890FF"}

    boolean showText() default true; // 是否在色块旁显示颜色值文本

}
```

## 示例

预设色板与透明度：

```java
@EruptField(
    edit = @Edit(title = "主题色", type = EditType.COLOR,
                 colorType = @ColorType(alpha = true, presets = {"#F5222D", "#1890FF", "#52C41A"}))
)
private String themeColor;
```
