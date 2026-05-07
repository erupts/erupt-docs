# 自定义模板 TPL

使用 FreeMarker 模板渲染字段内容，可嵌入任意 HTML，适合展示复杂自定义内容。需引入 `erupt-tpl` 模块。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "自定义内容", type = EditType.TPL,
                 tpl = @Tpl(path = "/template/custom.ftl"))
)
private String tplField;
```

> 模板文件放置于资源目录下，通过 `path` 指定相对路径。详见 [erupt-tpl 模块](/modules/erupt-tpl)。
