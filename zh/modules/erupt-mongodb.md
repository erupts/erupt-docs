# Erupt MongoDB NoSQL 数据源

erupt-mongodb 模块为 Erupt 框架提供 MongoDB 数据源支持，可以像管理关系型数据库一样管理 MongoDB 集合数据，完全复用 Erupt 的注解体系。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 配置

在 `application.yml` 中添加 MongoDB 连接配置：

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://username:password@localhost:27017/database
```

## 使用方式

将 JPA 实体的 `@Entity` + `@Table` 替换为 `@Document`，其余 Erupt 注解保持不变：

```java
@Erupt(name = "文章管理")
@Document(collection = "articles")
public class Article {

    @Id
    @EruptField
    private String id;

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true)
    )
    private String title;

    @EruptField(
        views = @View(title = "内容"),
        edit = @Edit(title = "内容", type = EditType.TEXTAREA)
    )
    private String content;

    @EruptField(
        views = @View(title = "创建时间"),
        edit = @Edit(title = "创建时间", type = EditType.DATE)
    )
    private Date createTime;
}
```

:::tip
MongoDB 文档的 `_id` 字段类型通常为 `String` 或 `ObjectId`，对应 Java 类型使用 `String` 即可。
:::

## 与 JPA 模块的区别

| 特性 | erupt-jpa | erupt-mongodb |
| --- | --- | --- |
| 数据库类型 | 关系型数据库 | MongoDB |
| 主键注解 | `@Id`（javax.persistence） | `@Id`（org.springframework.data） |
| 实体注解 | `@Entity` + `@Table` | `@Document` |
| 事务支持 | 完整支持 | 有限支持 |
