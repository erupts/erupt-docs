# Erupt JPA Database Extension

erupt-jpa extends standard Spring Data JPA to provide more powerful database query and operation capabilities for the Erupt framework. It is a required module for most Erupt projects.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Core Capabilities

- **LambdaQuery**: A strongly-typed query API that eliminates hardcoded strings
- **Multiple Data Sources**: Supports connecting to multiple databases simultaneously — see [Multiple Data Sources](/en/advanced/datasource)
- **Auto DDL**: Automatically creates or syncs table schemas based on entity classes (`generate-ddl: true`)
- **EruptDao**: Encapsulates common JPQL / JDBC operations — see [EruptDao Database Operations](/en/advanced/erupt-dao)
