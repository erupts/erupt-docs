# 评分器 RATE

星级评分组件，用户通过点击星星选择评分值，适合满意度、评级等场景。

## 基础用法

```java
@EruptField(
    views = @View(title = "评分"),
    edit = @Edit(title = "评分", type = EditType.RATE,
                 rateType = @RateType)
)
private Integer rate;
```

## 配置项

```java
public @interface RateType {

    String character() default ""; // 自定义字符，默认为星星

    boolean allowHalf() default false; // 是否允许半选

    int count() default 5; // 总星数

}
```
