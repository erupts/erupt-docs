# INPUT / TEXTAREA

> 占位文档，内容待补充。

`INPUT` 为单行文本输入框，`TEXTAREA` 为多行文本区域，是最常用的编辑器类型。

```java
@EruptField(
    edit = @Edit(title = "备注", type = EditType.TEXTAREA)
)
private String remark;
```
