# 单行文本框 INPUT

单行文本输入，支持正则校验、前缀/后缀下拉、密码等多种模式。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "输入框", inputType = @InputType)
)
private String input;
```

## 配置项

```java
public @interface InputType {

    int length() default DataLength.TEXT_LENGTH; // 最大长度

    String type() default "text"; // HTML input type，见下表

    boolean fullSpan() default false; // 是否跨整行显示

    String regex() default ""; // 正则校验

    VL[] prefix() default {}; // 左侧下拉选择框

    VL[] suffix() default {}; // 右侧下拉选择框

    boolean autoTrim() default true; // 是否自动 trim（1.12.10+）

}
```

**type 可选值：**

| type 值 | 表现形式 |
|---|---|
| `text` | 文本输入框（默认） |
| `password` | 密码框 |
| `email` | 邮箱输入框 |
| `color` | 颜色选择框 |
| `date` | 日期选择 |
| `datetime` | 日期时间选择 |
| `month` | 月选择 |
| `week` | 周选择 |
| `time` | 时间选择 |
| `range` | 数字滑块 |

## 示例

密码输入框：

```java
@EruptField(
    edit = @Edit(title = "密码", inputType = @InputType(type = "password"))
)
private String password;
```
