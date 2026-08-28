# 地理位置选择 MAP

地图选点组件，用户可在地图上点击选取坐标，坐标以字符串形式存储。底层使用高德地图。

![map](/field-types/map.png)

## 基础用法

```java
@EruptField(
    views = @View(title = "位置", type = ViewType.MAP),
    edit = @Edit(title = "位置", type = EditType.MAP)
)
private String location;
```

## 配置项

`EditType.MAP` **没有专属的 `@Edit` 子注解**，直接声明 `type = EditType.MAP` 即可，无任何配置项。

约束（源自 `EditType` 中 `MAP` 的声明）：

- 字段类型必须为 `String`
- 不支持 Excel 导入导出（`excelOperator = false`）
- 列表展示可搭配 `@View(type = ViewType.MAP)`

> 使用前需在前端 `app.js` 中配置高德地图 API Key：
>
> ```javascript
> window.eruptSiteConfig = {
>     amapKey: "your_amap_key",
>     amapSecurityJsCode: "your_security_code",
> };
> ```
