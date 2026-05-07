# 地理位置选择 MAP

地图选点组件，用户可在地图上点击选取坐标，坐标以字符串形式存储。底层使用高德地图。

## 基础用法

```java
@EruptField(
    views = @View(title = "位置", type = ViewType.MAP),
    edit = @Edit(title = "位置", type = EditType.MAP,
                 mapType = @MapType)
)
private String location;
```

> 使用前需在前端 `app.js` 中配置高德地图 API Key：
>
> ```javascript
> window.eruptSiteConfig = {
>     amapKey: "your_amap_key",
>     amapSecurityJsCode: "your_security_code",
> };
> ```
