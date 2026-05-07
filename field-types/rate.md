# 评分器 RATE

```java
@EruptField(
    views = @View(title = "评分"),
    edit = @Edit(title = "评分", type = EditType.RATE,
                 rateType = @RateType(max = 5))
)
private Integer rate;
```
