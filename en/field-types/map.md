# Geographic Location MAP

A map point-selection component. Users click on a map to pick a place. The field can be a `String` (holding JSON text) or, since 2.4.0, the `Location` type; the map vendor is chosen in the frontend config and defaults to Amap (AutoNavi).

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

- The field type is `String` or `xyz.erupt.annotation.model.Location` (2.4.0+)
- Excel import/export is not supported (`excelOperator = false`)
- For list display, pair it with `@View(type = ViewType.MAP)`; for a full-page map see the [MAP view](/en/annotation/vis-map)

## The Location Type <Badge type="tip" text="v2.4.0+" />

Since 2.4.0 the field can be declared as `xyz.erupt.annotation.model.Location`, so there is no JSON string to parse by hand:

```java
public class Location {

    private Double lng;      // longitude
    private Double lat;      // latitude
    private String name;     // place name as the vendor returned it
    private String address;
    private Crs crs = Crs.GCJ02; // coordinate reference system

    public enum Crs {
        GCJ02, // AMap, Tencent
        BD09,  // Baidu: a further offset on top of GCJ02
        WGS84  // Google, OpenStreetMap, Tianditu: the GPS datum
    }

}
```

```java
@Column(length = 500) // room for the name and address
@EruptField(
    views = @View(title = "Location", type = ViewType.MAP),
    edit = @Edit(title = "Location", type = EditType.MAP)
)
private Location location;
```

- `erupt-data-jpa` auto-applies `LocationConverter`, which stores a `Location` as JSON text in **one column**, the same text a `String` field holds, so an existing `String` field can **switch to `Location` without a migration**
- `crs` names the coordinate system of the lng/lat pair and defaults to `GCJ02`; rows written by AMap before 2.4.0, which carry no `crs`, are read as `GCJ02`
- In code, read the coordinates straight from `location.getLng()` / `getLat()`

## Map Vendors <Badge type="tip" text="v2.4.0+" />

The vendor is configured under `eruptSiteConfig.map` in the frontend `app.js`: `amap`, `baidu`, `tencent`, `tianditu`, `google` or `osm` (OpenStreetMap, no key needed):

```javascript
window.eruptSiteConfig = {
    map: {
        provider: "amap",
        key: "your_map_key",
        securityJsCode: "your_security_code", // amap only
        // mapId: "",       // google only: the map ID advanced markers require
        // darkStyleId: "", // baidu / tencent: a custom style id used while the dark theme is on
        // tileUrl: "",     // osm only: an XYZ tile url template replacing OpenStreetMap's
        // center: {lng: 116.4, lat: 39.9}, // where an empty map opens
    },
};
```

The frontend converts between the configured vendor's coordinate system and `Location.crs`, so `GCJ02` points saved in the AMap days still land in the right place after switching to Google or Tianditu, and vice versa.

:::tip
The legacy top-level `amapKey` / `amapSecurityJsCode` still work and mean `provider: "amap"`; a value under `map` takes precedence.
:::
