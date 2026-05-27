# 自动推测 AUTO

不指定 `type` 时，Erupt 会根据 Java 字段类型自动推断使用哪种编辑组件。

| 字段类型 | 映射组件 |
|:---:|:---:|
| `Integer` / `Float` / `Double` | `EditType.NUMBER` |
| `Boolean` | `EditType.BOOLEAN` |
| `Date` | `EditType.DATE` |
| 其他 | `EditType.INPUT` |

## 基础用法

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
