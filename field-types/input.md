# 文本类组件

## 单行文本框 INPUT

<!-- TODO: 添加截图 -->

### 使用方法

普通输入框：

```java
@EruptField(
    edit = @Edit(title = "输入框", inputType = @InputType)
)
private String input;
```

密码输入框：

```java
@EruptField(
    edit = @Edit(title = "密码输入", inputType = @InputType(type = "password"))
)
private String password;
```

### 配置项注解定义

```java
public @interface InputType {
    
    int length() default DataLength.TEXT_LENGTH; // 最大长度

    String type() default "text"; // 可选值，详见 type 类型说明

    boolean fullSpan() default false; // 是否跨整行显示

    String regex() default ""; // 输入内容正则匹配

    VL[] prefix() default {}; // 左侧下拉选择框

    VL[] suffix() default {}; // 右侧下拉选择框

    boolean autoTrim() default true; // 是否自动对输入值 trim，1.12.10 及以上版本支持
    
}
```

### InputType → type 配置说明

type 值会映射为 HTML `<input>` 标签 type 属性：

| type 值 | 表现形式 | 备注 |
| --- | --- | --- |
| `text` | 文本输入框 | 默认值 |
| `password` | 密码输入框 | |
| `color` | 颜色选择框 | 需浏览器支持 |
| `date` | 日期选择 | 需浏览器支持 |
| `datetime` | 时间日期选择 | 需浏览器支持 |
| `month` | 月选择 | 需浏览器支持 |
| `week` | 周选择 | 需浏览器支持 |
| `time` | 时间选择 | 需浏览器支持 |
| `email` | 电子邮箱 | 需浏览器支持 |
| `range` | 数字滑块 | 需浏览器支持 |

## 多行文本框 TEXTAREA

<!-- TODO: 添加截图 -->

```java
@Column(length = 2000) // 也可使用 @Lob 注解定义为大文本类型，支持存入更多的数据
@EruptField(
    views = @View(title = "多行文本框"),
    edit = @Edit(title = "多行文本框", type = EditType.TEXTAREA)
)
private String textarea;
```

## 横向分割线 DIVIDE

分割线用于在表单中对字段进行视觉分组，不存储任何数据。

```java
@EruptField(
    edit = @Edit(title = "-- 基本信息 --", type = EditType.DIVIDE)
)
private String divide;
```
