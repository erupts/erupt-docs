# Erupt Redis Data Source

The erupt-data-redis module provides a Redis data source. It binds an `@Erupt` model to a set of Redis Hashes — each row is a Hash stored at `<prefix><primary key>`, with model fields mapped to Hash fields.

It suits configuration entries, feature flags, session-like entities, small runtime dictionaries, and similar scenarios. The list query `SCAN`s all keys under the prefix, so it is not recommended for large data sets.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-redis</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Configuration

Use the standard Spring Boot configuration keys:

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ""
      database: 0
```

## The @EruptRedis Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | Key prefix; each row is stored at `<value><primary key>` |

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "功能开关", primaryKeyCol = "key")
@EruptRedis("feature:")
@EruptDataProcessor(EruptRedisDataService.DATA_PROCESSOR)
public class FeatureFlag {

    @EruptField(views = @View(title = "键"))
    private String key;

    @EruptField(
        views = @View(title = "是否启用"),
        edit = @Edit(title = "是否启用", type = EditType.BOOLEAN)
    )
    private Boolean enabled;

    @EruptField(edit = @Edit(title = "描述"))
    private String description;

    @EruptField(edit = @Edit(title = "更新人"))
    private String updatedBy;
}
```

A flag with primary key `home_banner` will be stored at the Redis key `feature:home_banner`, encoded as a Hash.

## Supported Operations

Full CRUD:

- **List**: `SCAN` the keys under the prefix, then `HGETALL` each key (enumeration is capped at 10000 keys)
- **Detail**: `HGETALL` `<prefix><id>`
- **Add / Edit**: `HSET` all field values; the primary key value also serves as the key suffix and **must be provided when adding**
- **Delete**: `DEL` `<prefix><id>`

:::warning Note
- **Flat models only.** Nested objects and collections are stored as JSON strings and are not automatically deserialized back into typed collections — declare them as `String` if you need round-trip consistency.
- **The primary key must be provided when adding**; it is not auto-generated.
- The list operation issues one `HGETALL` per row — do not use it on a prefix with thousands of entries.
:::
