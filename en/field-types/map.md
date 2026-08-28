# Geographic Location MAP

A map point-selection component. Users can click on a map to pick coordinates, which are stored as a string. Powered by Amap (AutoNavi).

![map](/field-types/map.png)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Location", type = ViewType.MAP),
    edit = @Edit(title = "Location", type = EditType.MAP)
)
private String location;
```

## Configuration

`EditType.MAP` has **no dedicated `@Edit` sub-annotation**. Declaring `type = EditType.MAP` is all that is required; there are no configuration options.

Constraints (from the `MAP` declaration in `EditType`):

- The field type must be `String`
- Excel import/export is not supported (`excelOperator = false`)
- For list display, pair it with `@View(type = ViewType.MAP)`

> Before use, configure your Amap API Key in the front-end `app.js`:
>
> ```javascript
> window.eruptSiteConfig = {
>     amapKey: "your_amap_key",
>     amapSecurityJsCode: "your_security_code",
> };
> ```
