# 布尔开关 BOOLEAN

<!-- TODO: 添加截图 -->

如果字段类型为 Boolean 可自动推测出组件类型 type 为 BOOLEAN。

## 使用方法

```java
@EruptField(
    edit = @Edit(
        title = "布尔选择器",
        boolType = @BoolType
    )
)
private Boolean bool;


@EruptField(
    edit = @Edit(
        title = "设定默认选中值",
        boolType = @BoolType
    )
)
private Boolean bool2 = true;
```

## 配置项注解定义

```java
public @interface BoolType {
    
    String trueText() default "是";   // 选中时文本

    String falseText() default "否";  // 非选中时文本

}
```
