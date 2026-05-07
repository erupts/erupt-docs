# 自动推测 AUTO

如果不指定 EditType 类型的情况下，可根据修饰字段类型等特征，自动推测使用组件。

| 字段类型 | 映射组件 |
| :---: | :---: |
| Integer | EditType.NUMBER |
| Float | EditType.NUMBER |
| Double | EditType.NUMBER |
| Boolean | EditType.BOOLEAN |
| Date | EditType.DATE |
| 其他 | EditType.INPUT |

## 代码演示

```java
@EruptField(
    edit = @Edit(title = "文本输入") // 相当于 type = EditType.INPUT
)
private String input;

@EruptField(
    edit = @Edit(title = "数值输入") // 相当于 type = EditType.NUMBER
)
private Integer number;

@EruptField(
    edit = @Edit(title = "布尔选择") // 相当于 type = EditType.BOOLEAN
)
private Boolean bool;

@EruptField(
    edit = @Edit(title = "时间选择") // 相当于 type = EditType.DATE
)
private Date date;
```
