# Geographic Location MAP

A map point-selection component. Users can click on a map to pick coordinates, which are stored as a string. Powered by Amap (AutoNavi).

![map](/field-types/map.png)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Location", type = ViewType.MAP),
    edit = @Edit(title = "Location", type = EditType.MAP,
                 mapType = @MapType)
)
private String location;
```

> Before use, configure your Amap API Key in the front-end `app.js`:
>
> ```javascript
> window.eruptSiteConfig = {
>     amapKey: "your_amap_key",
>     amapSecurityJsCode: "your_security_code",
> };
> ```
