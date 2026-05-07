# 布尔开关 BOOLEAN

是/否切换开关，字段类型为 `Boolean` 时可自动推测，无需显式指定 `type`。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "是否启用", boolType = @BoolType)
)
private Boolean enabled;
```

## 配置项

```java
public @interface BoolType {

    String trueText() default "Y";  // 选中时文本

    String falseText() default "N"; // 未选中时文本

}
```

## 示例

自定义文本 + 设置默认值：

```java
@EruptField(
    edit = @Edit(title = "性别",
                 boolType = @BoolType(trueText = "男", falseText = "女"))
)
private Boolean sex = true;
```
