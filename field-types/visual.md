# 可视化组件

## 地理位置选择 MAP

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

## 颜色选择 COLOR

```java
@EruptField(
    views = @View(title = "颜色"),
    edit = @Edit(title = "颜色", type = EditType.COLOR)
)
private String color;
```

## 评分器 RATE

```java
@EruptField(
    views = @View(title = "评分"),
    edit = @Edit(title = "评分", type = EditType.RATE,
                 rateType = @RateType(max = 5))
)
private Integer rate;
```
