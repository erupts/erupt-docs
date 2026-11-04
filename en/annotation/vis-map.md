# MAP View

Renders every row as a marker on a map. The position comes from an `EditType.MAP` field or from a pair of numeric lng / lat fields; markers can be colored by a field and are clustered when zoomed out, and clicking one opens an info window with a link to the row. Used with `@Vis(type = Vis.Type.MAP)`.

> **Supported in 2.4.0+**

![MAP view (AMap)](/annotation/vis-map.png)

The map runs on AMap, Baidu, Tencent, Tianditu, Google or OpenStreetMap, picked in the frontend config; see [Map Vendor Configuration](#map-vendor-configuration).

## Complete Example

```java
@Entity
@Table(name = "t_store")
@Erupt(
    name = "Stores",
    visRawTable = true,
    vis = {
        @Vis(
            code = "map",
            title = "Map",
            type = Vis.Type.MAP,
            mapView = @MapView(locationField = "location", colorField = "color")
        )
    }
)
public class Store extends BaseModel {

    @EruptField(
        views = @View(title = "Store Name"),
        edit = @Edit(title = "Store Name", notNull = true)
    )
    private String name;

    @Column(length = 500)
    @EruptField(
        views = @View(title = "Location", type = ViewType.MAP),
        edit = @Edit(title = "Location", type = EditType.MAP)
    )
    private Location location;

    @EruptField(
        views = @View(title = "Color"),
        edit = @Edit(title = "Color", type = EditType.COLOR)
    )
    private String color;

}
```

Without an `EditType.MAP` field, two numeric fields can supply the coordinates instead:

```java
@Vis(
    title = "Map",
    type = Vis.Type.MAP,
    mapView = @MapView(lngField = "lng", latField = "lat")
)
```

## @MapView Attributes

```java
public @interface MapView {

    String locationField() default ""; // EditType.MAP field; empty uses lngField / latField

    String lngField() default "";      // longitude field

    String latField() default "";      // latitude field

    String colorField() default "";    // hex color field for the marker

    boolean cluster() default true;    // merge nearby markers into clusters while zoomed out

}
```

| Attribute | Description |
|-----------|-------------|
| `locationField` | Name of the `EditType.MAP` field whose value ([Location](#location-type) JSON) carries lng / lat; when empty, `lngField` / `latField` are used instead |
| `lngField` | Longitude field name, numeric, used together with `latField` |
| `latField` | Latitude field name, numeric |
| `colorField` | Optional. Hex color field name (e.g. `#FF5733`) for the marker |
| `cluster` | Whether nearby markers are clustered, defaults to `true`; while zoomed out, several markers merge into one cluster showing their count |

## Rendering Rules

- One marker per row; rows without a position are left off the map
- Clicking a marker opens an info window with the row's visible columns, and its "open" link opens the row for editing / viewing
- The map view loads the full result set at once and hides the pager; search conditions still apply
- Positions supplied through `lngField` / `latField` alone are read as AMap GCJ-02 coordinates; for another coordinate system use a `Location` field and set its `crs`

## Map Vendor Configuration

The map view shares its frontend configuration with `EditType.MAP` fields, set in `app.js` under `eruptSiteConfig.map`:

```javascript
window.eruptSiteConfig = {
    map: {
        provider: "amap",   // amap | baidu | tencent | tianditu | google | osm
        key: "xxx",
        securityJsCode: "xxx",            // amap only
        // mapId: "",                     // google only: Map ID required for advanced markers
        // darkStyleId: "",               // baidu / tencent: custom style id used in dark mode
        // tileUrl: "",                   // osm only: a custom XYZ tile url template
        // center: {lng: 116.4, lat: 39.9} // where an empty map opens
    }
}
```

| provider | Vendor | Coordinate system |
|----------|--------|-------------------|
| `amap` | AMap (default) | GCJ-02 |
| `baidu` | Baidu Maps | BD-09 |
| `tencent` | Tencent Maps | GCJ-02 |
| `tianditu` | Tianditu | WGS-84 |
| `google` | Google Maps | WGS-84 |
| `osm` | OpenStreetMap, no key needed | WGS-84 |

:::info
The legacy top-level `amapKey` / `amapSecurityJsCode` settings still work and are equivalent to `provider: "amap"`; the same keys inside the `map` block take precedence. Vendor SDKs are fetched from their CDNs at runtime, nothing is bundled.
:::

## Location Type

`xyz.erupt.annotation.model.Location` is the typed value of an `EditType.MAP` field, independent of the map vendor:

```java
public class Location {

    private Double lng;      // longitude
    private Double lat;      // latitude
    private String name;     // place name as the vendor returned it
    private String address;
    private Crs crs = Crs.GCJ02;  // coordinate system the lng / lat pair is expressed in

    public enum Crs {
        GCJ02, // AMap, Tencent
        BD09,  // Baidu: a further offset on top of GCJ-02
        WGS84  // Google, OpenStreetMap, Tianditu: the GPS datum
    }

}
```

- `crs` names the coordinate system of the pair; the frontend converts when the configured vendor uses another one, so switching vendors needs no data migration
- `erupt-data-jpa` ships an auto-applied `LocationConverter` that stores a `Location` as JSON in a single string column; give the column room for a name and address, e.g. `@Column(length = 500)`
- An `EditType.MAP` field previously declared as `String` holds the very same JSON, so it can change to `Location` without a migration; keeping it as `String` also still works
- Values written before the field existed came from AMap and are read as `GCJ02`

See [Location Picker MAP](/en/field-types/map) for the `EditType.MAP` field itself.
