# TPL 自定义 HTML 模板

使用自定义 HTML 模板渲染字段内容，需导入 erupt-tpl 模块。

```java
@EruptField(
    edit = @Edit(title = "自定义模板", type = EditType.TPL,
                 tpl = @Tpl(path = "/template/custom.ftl"))
)
private String tplField;
```
