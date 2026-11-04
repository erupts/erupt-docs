# 地理位置选择 MAP

地图选点组件，用户可在地图上点击选取坐标。字段可声明为 `String`（存 JSON 文本）或 2.4.0 起的 `Location` 类型；地图厂商由前端配置决定，默认高德。

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

- 字段类型为 `String` 或 `xyz.erupt.annotation.model.Location`（2.4.0+）
- 不支持 Excel 导入导出（`excelOperator = false`）
- 列表展示可搭配 `@View(type = ViewType.MAP)`，整页地图视图见 [地图视图 MAP](/zh/annotation/vis-map)

## Location 类型 <Badge type="tip" text="v2.4.0+" />

2.4.0 起字段可直接声明为 `xyz.erupt.annotation.model.Location`，不必再自己解析 JSON 字符串：

```java
public class Location {

    private Double lng;      // 经度
    private Double lat;      // 纬度
    private String name;     // 地点名称（厂商返回）
    private String address;  // 详细地址
    private Crs crs = Crs.GCJ02; // 坐标系

    public enum Crs {
        GCJ02, // 高德、腾讯
        BD09,  // 百度，在 GCJ02 基础上再偏移
        WGS84  // Google、OpenStreetMap、天地图，即 GPS 坐标
    }

}
```

```java
@Column(length = 500) // 给名称与地址留足长度
@EruptField(
    views = @View(title = "位置", type = ViewType.MAP),
    edit = @Edit(title = "位置", type = EditType.MAP)
)
private Location location;
```

- `erupt-data-jpa` 自动应用 `LocationConverter`，把 `Location` 作为 JSON 文本存入**一列**，与 `String` 字段存的内容一致，因此老模型可以**直接把 `String` 改成 `Location`，无需迁移数据**
- `crs` 记录经纬度所属坐标系，默认 `GCJ02`；2.4.0 之前由高德写入、没有 `crs` 的旧数据一律按 `GCJ02` 读取
- 代码中可直接 `location.getLng()` / `getLat()` 读取坐标

## 多厂商地图 <Badge type="tip" text="v2.4.0+" />

地图厂商在前端 `app.js` 的 `eruptSiteConfig.map` 中配置，支持 `amap`（高德）、`baidu`、`tencent`、`tianditu`（天地图）、`google`、`osm`（OpenStreetMap，无需 Key）：

```javascript
window.eruptSiteConfig = {
    map: {
        provider: "amap",
        key: "your_map_key",
        securityJsCode: "your_security_code", // 仅高德需要
        // mapId: "",       // 仅 google：高级标记所需的 map ID
        // darkStyleId: "", // baidu / tencent：深色主题下使用的自定义样式 id
        // tileUrl: "",     // 仅 osm：替换 OpenStreetMap 的 XYZ 瓦片地址
        // center: {lng: 116.4, lat: 39.9}, // 空地图的初始中心
    },
};
```

前端按所配厂商的坐标系与 `Location.crs` 之间自动换算：高德时代存下的 `GCJ02` 坐标切到 Google 或天地图后仍能落在正确位置，反之亦然。

:::tip
旧的顶层 `amapKey` / `amapSecurityJsCode` 仍然有效，等价于 `provider: "amap"`；`map` 中的同名项优先。
:::
