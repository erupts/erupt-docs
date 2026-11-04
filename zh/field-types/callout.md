# 提示区块 CALLOUT <Badge type="tip" text="2.0.2+" />

在表单中渲染一段静态的引导性内容（支持 HTML），用于填写说明、注意事项等场景。字段仅用于展示，**不会被表单采集，也不会持久化到数据库**，建议标记 `@Transient`。

![callout](/field-types/callout.png)

## 基础用法

```java
@Transient
@EruptField(
    edit = @Edit(title = "填写指南", type = EditType.CALLOUT,
        calloutType = @CalloutType(value = "带 <b>*</b> 的字段为必填项", style = CalloutType.Style.INFO))
)
private String callout;
```

## 配置项 @CalloutType

```java
public @interface CalloutType {

    String value() default ""; // 提示内容，支持 HTML

    Style style() default Style.CARD; // 展示样式

    enum Style {
        CARD,    // 带边框的卡片面板
        INFO,    // 信息提示条
        SUCCESS, // 成功提示条
        WARNING, // 警告提示条
        ERROR    // 错误提示条
    }

}
```

:::tip
`CARD` 样式渲染为带边框的面板，其余样式渲染为对应色彩的提示横幅（Alert）。
:::
