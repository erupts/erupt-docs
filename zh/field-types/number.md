# 数值输入 NUMBER

数值输入框，字段类型为 `Integer` / `Float` / `Double` 时可自动推测，无需显式指定 `type`。

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
