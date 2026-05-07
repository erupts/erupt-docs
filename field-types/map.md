# 地理位置选择 MAP

使用地图组件须在 app.js 中指定高德地图 API Key：

```javascript
window.eruptSiteConfig = {
    amapKey: "xxxx",
    amapSecurityJsCode: "xxxxx",
};
```

```java
@EruptField(
    views = @View(title = "位置", type = ViewType.MAP),
    edit = @Edit(title = "位置", type = EditType.MAP,
                 mapType = @MapType)
)
private String location;
```
