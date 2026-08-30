# 数值输入 NUMBER

数值输入框，字段类型为 `Integer` / `Float` / `Double` 时可自动推测，无需显式指定 `type`。

![number](/field-types/number.png)

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "数字输入", numberType = @NumberType)
)
private Integer number;
```

## 配置项

```java
public @interface NumberType {

    long max() default Integer.MAX_VALUE; // 最大值

    long min() default -Integer.MAX_VALUE; // 最小值

    // 小数精度（2.1.1+）：-1 保持原样输入，0 强制整数，N 保留 N 位小数
    int precision() default -1;

    // 步进值（2.1.1+）：加减按钮与鼠标滚轮的调整幅度
    double step() default 1;

    // 输入框内前缀单位（2.1.1+），如 ¥ / $
    String prefix() default "";

    // 输入框内后缀单位（2.1.1+），如 % / kg / ms
    String suffix() default "";

    // 千分位分隔符（2.1.1+），仅影响展示，不影响存储值
    boolean thousandsSeparator() default false;

}
```

## 示例

限制正整数：

```java
@EruptField(
    edit = @Edit(title = "正整数", numberType = @NumberType(min = 0))
)
private Integer number;
```

浮点数输入：

```java
@EruptField(
    edit = @Edit(title = "浮点数", numberType = @NumberType)
)
private Float number;
```

金额输入（2.1.1+）：

```java
@EruptField(
    edit = @Edit(title = "金额", numberType = @NumberType(
        min = 0, precision = 2, prefix = "¥", thousandsSeparator = true))
)
private Double amount;
```
