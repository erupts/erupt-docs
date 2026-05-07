# 其他组件

## TPL 自定义 HTML 模板

使用自定义 HTML 模板渲染字段内容，需导入 erupt-tpl 模块。

```java
@EruptField(
    edit = @Edit(title = "自定义模板", type = EditType.TPL,
                 tpl = @Tpl(path = "/template/custom.ftl"))
)
private String tplField;
```

## HIDDEN 隐藏字段

隐藏字段，不在表单中显示，但值会随其他字段一起提交。

```java
@EruptField(
    edit = @Edit(title = "隐藏字段", type = EditType.HIDDEN)
)
private String hiddenField;
```

## EMPTY 空占位

空组件，仍占据组件位置，用于表单布局对齐。

```java
@EruptField(
    edit = @Edit(title = "", type = EditType.EMPTY)
)
private String emptyField;
```
