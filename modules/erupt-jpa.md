# Erupt JPA 数据库扩展

erupt-jpa 在标准 Spring Data JPA 的基础上，为 Erupt 框架提供更强大的数据库查询与操作能力，是大多数 Erupt 项目的必选模块。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 核心能力

- **LambdaQuery**：强类型查询 API，避免字符串硬编码
- **多数据源**：支持同时连接多个数据库，详见[多数据源](/advanced/datasource)
- **自动建表**：根据实体类自动创建或同步表结构（`generate-ddl: true`）
- **EruptDao**：封装常用 JPQL / JDBC 操作，详见 [EruptDao 数据库操作](/advanced/erupt-dao)
