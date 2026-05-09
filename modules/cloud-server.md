# Erupt Cloud Server 部署

> 用于管理 Node 节点，负责服务注册中心、请求调度与负载分发。

## 使用方法

### 1. 创建 Erupt 项目

参考 [快速开始](/guide/quick-start)

### 2. 添加 Maven 依赖

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-server</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 3. 添加 Redis 配置并开启 redis-session

```yaml
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
erupt:
  redis-session: true
```

### 4. 启动项目

<img src="/cloud/server-start.png" width="900">

登录后出现节点管理相关菜单：

<img src="/cloud/server-menu.png" width="900">

**部署成功！**

## 可选配置

```yaml
erupt:
  cloud-server:
    # cloud key 命名空间（可选）
    cloud-name-space: 'erupt-cloud:'
    # node 节点持久化时长，单位：ms
    node-expire-time: 60000
    # node 节点存活检查周期，单位：ms
    node-survive-check-time: 120000
    # 是否校验 node 节点 access-token，默认 true（1.11.4+ 支持）
    validate-access-token: true
```

## Docker 部署

Server 端支持 Docker 方式部署，新功能仅需开发 Node 节点即可：

```bash
docker pull erupts/erupt-cloud-server:version
```

镜像版本同 Erupt 版本号，版本信息：[https://hub.docker.com/repository/docker/erupts/erupt-cloud-server/general](https://hub.docker.com/repository/docker/erupts/erupt-cloud-server/general)

可参照 [更新日志](/guide/changelog) 获取最新版本号。
