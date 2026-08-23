# Erupt File 文件数据源

erupt-data-file 模块提供文件数据源支持。将 `@Erupt` 模型绑定到一个数据文件——CSV、TSV、JSON、JSON Lines、YAML、INI、Properties、带 Front-matter 的 Markdown 或 XML——每次查询重新读取文件，每次写入整体重写。

适用于配置 / 字典 / 小数据场景（功能开关、翻译、示例数据、博客文章等），不适合大数据量存储。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-file</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

YAML 格式需要 classpath 中存在 SnakeYAML（Spring Boot 通常已自带）。

## @EruptFile 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 文件路径（绝对路径或相对工作目录） |
| `type` | `AUTO` | 文件格式，`AUTO` 按扩展名推断 |
| `single` | `false` | `true` 表示单记录文件（设置/配置表单），`false` 表示列表 |

### 支持的格式

| 扩展名 | 模式 | 说明 |
| --- | --- | --- |
| `.csv` | 列表 | 首行为字段名表头 |
| `.tsv` | 列表 | Tab 分隔 |
| `.json` | 列表/单记录 | 支持嵌套字段，`single = true` 时为对象结构 |
| `.jsonl` / `.ndjson` | 列表 | 每行一个 JSON 对象 |
| `.yml` / `.yaml` | 列表/单记录 | 需要 SnakeYAML |
| `.properties` | 单记录 | Java properties，恒为单记录 |
| `.ini` | 单记录 | `[section]` 分组，每个 section 映射为嵌套对象字段 |
| `.md` / `.markdown` | 单记录 | Front-matter + 正文，正文映射到 `content` 字段 |
| `.xml` | 列表/单记录 | 根元素包裹 `<item>` 行，`single = true` 时根元素即单条记录 |

## 示例一：CSV 字典

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

## 示例二：单记录配置文件

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

## 操作支持

完整 CRUD。新增时若未提供主键：数值类型字段取 `max + 1`，其余类型生成 UUID 字符串。同一文件的写操作以路径级锁串行化；外部修改会在下一次查询时被读到（无缓存）。

:::warning 注意
- 每次操作都会整体读写文件，请勿指向数 MB 以上的数据文件。
- 文件不存在时视为空数据集，首次写入时自动创建，但**父目录必须已存在**。
- 单记录模型建议在文件中保留主键值，以便钻取 / 行操作能定位该行。
:::
