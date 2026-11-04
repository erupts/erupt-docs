# Erupt Redis 数据源

erupt-data-redis 模块提供 Redis 数据源支持。将 `@Erupt` 模型绑定到一组 Redis Hash——每条数据是一个存储在 `<前缀><主键>` 的 Hash，模型字段映射为 Hash 字段。

适用于配置项、功能开关（Feature Flag）、会话类实体、小型运行时字典等场景。列表查询会 `SCAN` 前缀下所有键，不建议用于大数据集。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-redis</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 配置

使用标准 Spring Boot 配置项：

```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: ""
      database: 0
```

## @EruptRedis 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 键前缀，每条数据存储在 `<value><主键>` |

## 使用示例

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

主键为 `home_banner` 的开关将存储在 Redis 键 `feature:home_banner` 中，以 Hash 编码。

## 操作支持

完整 CRUD：

- **列表**：`SCAN` 前缀下的键，逐键 `HGETALL`（枚举上限 10000 个键）
- **详情**：`HGETALL` `<前缀><id>`
- **新增 / 修改**：`HSET` 全部字段值，主键值同时作为键后缀，**新增时必须提供**
- **删除**：`DEL` `<前缀><id>`

:::warning 注意
- **仅支持扁平模型。** 嵌套对象与集合会以 JSON 字符串形式存储，且不会自动反序列化回类型化集合——如需往返一致请声明为 `String`。
- **新增时必须提供主键**，不会自动生成。
- 列表操作对每行执行一次 `HGETALL`，请勿在有数千条数据的前缀上使用。
:::
