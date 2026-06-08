# Erupt MongoDB NoSQL Data Source

The erupt-mongodb module adds MongoDB data source support to the Erupt framework. You can manage MongoDB collection data just like a relational database, fully reusing Erupt's annotation system.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Configuration

Add the MongoDB connection configuration to `application.yml`:

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://username:password@localhost:27017/database
```

## Usage

Replace the JPA entity's `@Entity` + `@Table` with `@Document`. All other Erupt annotations remain unchanged:

```java
@Erupt(name = "Article Management")
@Document(collection = "articles")
public class Article {

    @Id
    @EruptField
    private String id;

    @EruptField(
        views = @View(title = "Title"),
        edit = @Edit(title = "Title", notNull = true)
    )
    private String title;

    @EruptField(
        views = @View(title = "Content"),
        edit = @Edit(title = "Content", type = EditType.TEXTAREA)
    )
    private String content;

    @EruptField(
        views = @View(title = "Created At"),
        edit = @Edit(title = "Created At", type = EditType.DATE)
    )
    private Date createTime;
}
```

:::tip
The `_id` field type in a MongoDB document is typically `String` or `ObjectId`. Use `String` as the corresponding Java type.
:::

## Differences from the JPA Module

| Feature | erupt-jpa | erupt-mongodb |
| --- | --- | --- |
| Database Type | Relational databases | MongoDB |
| Primary Key Annotation | `@Id` (javax.persistence) | `@Id` (org.springframework.data) |
| Entity Annotation | `@Entity` + `@Table` | `@Document` |
| Transaction Support | Full support | Limited support |
