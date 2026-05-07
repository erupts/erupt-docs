# V 1.13.x 升级指南

本文档说明从 1.12.x 升级到 1.13.x 时需要注意的事项。

## 升级要求

1. Spring Boot 版本升级至 3.x，如何升级请参考：[Spring Boot 3.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide)
2. JDK 最低版本要求为 JDK 17
3. 修改主键生成策略，不再支持 PostgreSQL < 10、Oracle < 12c
4. 正式下线用 RESTful api 表示的 delete 和 put 接口，统一使用 HTTP POST 代替，下线接口如下，升级此版本后请及时调整 API 调用：
   - `delete /erupt-api/data/modify/{erupt}`
   - `put /erupt-api/data/modify/{erupt}`
5. 使用 erupt cloud 的系统 node 节点必须全部升级到 1.13.x
6. eruptDao 删除已过时的 `queryXXX` 数据库查询 api，请使用 `lambdaQuery` 代替
7. `ShowBy` 注解更名为 `Dynamic`，升级后需要调整已有注解配置：

```yaml
showBy = @ShowBy
↓
dynamic = @Dynamic
```
