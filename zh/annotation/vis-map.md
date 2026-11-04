# 地图视图 MAP

把每条记录渲染为地图上的一个标记点。位置来自 `EditType.MAP` 字段，或一对经纬度数值字段；支持按字段着色、聚合显示，点击标记弹出信息窗并可直接打开该行。配合 `@Vis(type = Vis.Type.MAP)` 使用。

> **2.4.0 及以上版本支持**

![地图视图（高德地图）](/annotation/vis-map.png)

地图支持高德、百度、腾讯、天地图、Google 与 OpenStreetMap，在前端配置中切换，见 [地图厂商配置](#地图厂商配置)。

## 完整示例

```java
@Entity
@Table(name = "t_store")
@Erupt(
    name = "门店管理",
    visRawTable = true,
    vis = {
        @Vis(
            code = "map",
            title = "地图",
            type = Vis.Type.MAP,
            mapView = @MapView(locationField = "location", colorField = "color")
        )
    }
)
public class Store extends BaseModel {

    @EruptField(
        views = @View(title = "门店名称"),
        edit = @Edit(title = "门店名称", notNull = true)
    )
    private String name;

    @Column(length = 500)
    @EruptField(
        views = @View(title = "位置", type = ViewType.MAP),
        edit = @Edit(title = "位置", type = EditType.MAP)
    )
    private Location location;

    @EruptField(
        views = @View(title = "颜色"),
        edit = @Edit(title = "颜色", type = EditType.COLOR)
    )
    private String color;

}
```

没有 `EditType.MAP` 字段时，也可以直接用两个数值字段提供经纬度：

```java
@Vis(
    title = "地图",
    type = Vis.Type.MAP,
    mapView = @MapView(lngField = "lng", latField = "lat")
)
```

## @MapView 属性说明

```java
public @interface MapView {

    String locationField() default ""; // EditType.MAP 字段；为空时使用 lngField / latField

    String lngField() default "";      // 经度字段

    String latField() default "";      // 纬度字段

    String colorField() default "";    // 标记颜色字段，值为十六进制色值

    boolean cluster() default true;    // 缩小地图时把相邻标记聚合显示

}
```

| 属性名 | 描述 |
|--------|------|
| `locationField` | `EditType.MAP` 字段名，其值（[Location](#location-类型) JSON）携带经纬度；为空时改用 `lngField` / `latField` |
| `lngField` | 经度字段名，数值类型，与 `latField` 搭配使用 |
| `latField` | 纬度字段名，数值类型 |
| `colorField` | 可选。标记颜色字段名，值为十六进制色值（如 `#FF5733`） |
| `cluster` | 是否聚合相邻标记，默认 `true`；地图缩小时多个标记合并为一个带数量的聚合点 |

## 展示规则

- 每条记录一个标记；位置为空的记录不会出现在地图上
- 点击标记弹出信息窗，显示该行的可见列，信息窗中的「打开」链接进入该行的编辑 / 详情
- 地图视图会一次性加载查询结果的全部记录并隐藏分页器，搜索条件仍然生效
- 只用 `lngField` / `latField` 提供位置时，坐标按高德的 GCJ-02 坐标系解读；需要其他坐标系请改用 `Location` 字段并设置 `crs`

## 地图厂商配置

地图视图与 `EditType.MAP` 字段共用同一份前端配置，在 `app.js` 的 `eruptSiteConfig.map` 中设置：

```javascript
window.eruptSiteConfig = {
    map: {
        provider: "amap",   // amap | baidu | tencent | tianditu | google | osm
        key: "xxx",
        securityJsCode: "xxx",            // 仅 amap
        // mapId: "",                     // 仅 google：高级标记所需的 Map ID
        // darkStyleId: "",               // baidu / tencent：暗色模式使用的自定义样式 id
        // tileUrl: "",                   // 仅 osm：自定义 XYZ 瓦片地址
        // center: {lng: 116.4, lat: 39.9} // 空地图的初始中心点
    }
}
```

| provider | 厂商 | 坐标系 |
|----------|------|--------|
| `amap` | 高德地图（默认） | GCJ-02 |
| `baidu` | 百度地图 | BD-09 |
| `tencent` | 腾讯地图 | GCJ-02 |
| `tianditu` | 天地图 | WGS-84 |
| `google` | Google Maps | WGS-84 |
| `osm` | OpenStreetMap，无需 key | WGS-84 |

:::info
旧版顶层的 `amapKey` / `amapSecurityJsCode` 配置仍然有效，等价于 `provider: "amap"`；`map` 块中的同名配置优先。厂商 SDK 在运行时从各自 CDN 加载，前端不内置。
:::

## Location 类型

`xyz.erupt.annotation.model.Location` 是 `EditType.MAP` 字段的类型化值，与地图厂商无关：

```java
public class Location {

    private Double lng;      // 经度
    private Double lat;      // 纬度
    private String name;     // 地点名称，由地图厂商返回
    private String address;  // 地址
    private Crs crs = Crs.GCJ02;  // 经纬度所用的坐标系

    public enum Crs {
        GCJ02, // 高德、腾讯
        BD09,  // 百度，在 GCJ-02 基础上再偏移
        WGS84  // Google、OpenStreetMap、天地图，即 GPS 坐标
    }

}
```

- `crs` 记录这组经纬度所属的坐标系，前端在配置的厂商使用不同坐标系时自动换算，因此换地图厂商不需要迁移数据
- `erupt-data-jpa` 自带自动生效的 `LocationConverter`，把 `Location` 以 JSON 形式存入一个字符串列；建议给列留出足够长度，如 `@Column(length = 500)`
- 之前声明为 `String` 的 `EditType.MAP` 字段存的就是同一份 JSON，可直接改为 `Location` 类型而无需迁移数据；继续使用 `String` 也可以
- 字段出现之前写入的旧数据来自高德，按 `GCJ02` 读取

`EditType.MAP` 字段本身的用法见 [地理位置选择 MAP](/zh/field-types/map)。
