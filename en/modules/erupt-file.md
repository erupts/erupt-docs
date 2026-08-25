# Erupt File Data Source

The erupt-data-file module provides a file-based data source. It binds an `@Erupt` model to a data file — CSV, TSV, JSON, JSON Lines, YAML, INI, Properties, Markdown with front-matter, or XML. The file is re-read on every query and rewritten in full on every write.

It suits configuration / dictionary / small-data scenarios (feature flags, translations, sample data, blog posts, etc.) and is not intended for large data volumes.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-file</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

The YAML format requires SnakeYAML on the classpath (usually already bundled with Spring Boot).

## The @EruptFile Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | File path (absolute, or relative to the working directory) |
| `type` | `AUTO` | File format; `AUTO` infers it from the extension |
| `single` | `false` | `true` means a single-record file (settings/config form); `false` means a list |

### Supported Formats

| Extension | Mode | Description |
| --- | --- | --- |
| `.csv` | list | First row is a header of field names |
| `.tsv` | list | Tab-separated |
| `.json` | list / single | Supports nested fields; an object structure when `single = true` |
| `.jsonl` / `.ndjson` | list | One JSON object per line |
| `.yml` / `.yaml` | list / single | Requires SnakeYAML |
| `.properties` | single | Java properties, always single-record |
| `.ini` | single | `[section]` groups; each section maps to a nested object field |
| `.md` / `.markdown` | single | Front-matter + body; the body maps to a `content` field |
| `.xml` | list / single | Root element wraps `<item>` rows; with `single = true` the root element is the single record |

## Example 1: CSV Dictionary

```java
@Getter
@Setter
@Erupt(name = "国家字典", primaryKeyCol = "code")
@EruptFile("data/countries.csv")
@EruptDataProcessor(EruptFileDataService.DATA_PROCESSOR)
public class Country {

    @EruptField(views = @View(title = "代码"))
    private String code;

    @EruptField(
        views = @View(title = "名称"),
        edit = @Edit(title = "名称", search = @Search(vague = true))
    )
    private String name;

    @EruptField(views = @View(title = "大洲"), edit = @Edit(title = "大洲"))
    private String continent;
}
```

## Example 2: Single-Record Config File

```java
@Getter
@Setter
@Erupt(name = "应用设置", primaryKeyCol = "id")
@EruptFile(value = "config/app.yml", single = true)
@EruptDataProcessor(EruptFileDataService.DATA_PROCESSOR)
public class AppSettings {

    @EruptField(views = @View(title = "ID"))
    private String id;

    @EruptField(edit = @Edit(title = "站点标题"))
    private String siteTitle;

    @EruptField(edit = @Edit(title = "客服邮箱"))
    private String supportEmail;
}
```

## Supported Operations

Full CRUD. If no primary key is provided on add: numeric fields use `max + 1`, other types get a generated UUID string. Writes to the same file are serialized by a per-path lock; external modifications are picked up on the next query (no caching).

:::warning Note
- Every operation reads and rewrites the entire file — do not point it at data files larger than a few MB.
- A missing file is treated as an empty data set and is created automatically on the first write, but **the parent directory must already exist**.
- For single-record models, keep the primary key value in the file so drill / row operations can locate the record.
:::
