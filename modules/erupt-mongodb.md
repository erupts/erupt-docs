# Erupt MongoDB NoSQL 数据源

erupt-mongodb 模块为 erupt 框架提供 MongoDB 数据源支持，可以像管理关系型数据库一样管理 MongoDB 数据。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 配置

在 application.yml 中添加 MongoDB 连接配置：

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://username:password@localhost:27017/database
```

## 使用方式

在实体类上使用 `@Document` 注解替代 `@Entity` 和 `@Table`，并配合 `@Erupt` 注解使用：

```java
@Erupt(name = "MongoDB 示例")
@Document(collection = "demo_collection")
public class MongoDemo {
    
    @Id
    @EruptField
    private String id;
    
    @EruptField(
        views = @View(title = "名称"),
        edit = @Edit(title = "名称")
    )
    private String name;
    
}
```
