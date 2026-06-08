# Custom Template TPL

Renders field content using a FreeMarker template, allowing arbitrary HTML to be embedded. Suitable for displaying complex custom content. Requires the `erupt-tpl` module.

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Custom Content", type = EditType.TPL,
                 tpl = @Tpl(path = "/template/custom.ftl"))
)
private String tplField;
```

> Template files are placed in the resources directory and referenced via the `path` attribute as a relative path. See [erupt-tpl module](/en/modules/erupt-tpl) for details.
