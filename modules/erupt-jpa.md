# Erupt JPA 数据库能力高度扩展

erupt-jpa 模块在标准 Spring Data JPA 的基础上，为 erupt 框架提供更强大的数据库查询和操作能力。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 核心能力

- LambdaQuery 强类型查询 API
- 多数据源支持
- 自动建表与字段同步
- 关联查询优化

详见：[EruptDao（JDBC）](/dev/erupt-dao)
