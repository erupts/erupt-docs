# 数字滑块 SLIDER

通过拖拽滑块输入数值，适合有范围限制的数值选择场景。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "数字滑块",
                 type = EditType.SLIDER,
                 sliderType = @SliderType(max = 100))
)
private Integer slider;
```

## 配置项

```java
public @interface SliderType {

    int max();                    // 最大值（必填）

    int min() default 0;          // 最小值

    float step() default 1;       // 步进值

    boolean dots() default false; // 是否只能拖拽到刻度上

    float[] markPoints() default {}; // 刻度点数组

}
```

## 示例

指定可选刻度：

```java
@EruptField(
    edit = @Edit(title = "栅格数",
                 type = EditType.SLIDER,
                 sliderType = @SliderType(max = 12, markPoints = {1f, 2f, 3f, 4f, 6f, 8f, 12f}, dots = true))
)
private Integer grid = 1;
```
