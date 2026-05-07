# 数值类组件

## 计数器 NUMBER

<!-- TODO: 添加截图 -->

erupt 可通过字段类型自动推测是数值输入框。

```java
@EruptField(
    edit = @Edit(title = "数字输入", numberType = @NumberType)
)
private Integer number;
```

### 配置项注解定义

```java
public @interface NumberType {
    long max() default Integer.MAX_VALUE; // 可输入最大值

    long min() default -Integer.MAX_VALUE; // 可输入的最小值
}
```

### 代码演示

正整数输入：

```java
@EruptField(
    edit = @Edit(title = "数字输入", numberType = @NumberType(min = 0))
)
private Integer number;
```

浮点型输入：

```java
@EruptField(
    edit = @Edit(title = "数字输入", numberType = @NumberType)
)
private Float number;
```

## 数字滑块 SLIDER

<!-- TODO: 添加截图 -->

```java
@EruptField(
    edit = @Edit(title = "数字滑块", 
                 type = EditType.SLIDER, 
                 sliderType = @SliderType(max = 100))
)
private Integer slider;
```

### 配置项注解定义

```java
public @interface SliderType {
    int max();  // 滑块最大值

    int min() default 0;  // 滑块最小值

    int step() default 1; // 步进

    boolean dots() default false;  // 是否只能拖拽到刻度上

    int[] markPoints() default {}; // 刻度数组
}
```

### 代码演示

指定可选刻度：

```java
@EruptField(
    edit = @Edit(title = "栅格数", 
                 type = EditType.SLIDER,
                 sliderType = @SliderType(max = 12, markPoints = {1, 2, 3, 4, 6, 8, 12}, dots = true))
)
private Integer grid = 1;
```
