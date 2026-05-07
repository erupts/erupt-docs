# 快速部署

## 环境要求

- Java 版本 **17** 及以上
- Spring Boot 版本 **3.X**
- 浏览器要求 IE11 以上，或其他现代浏览器
- 服务器配置最低：0.5 核、200M
- 支持 K8S 与 Docker 部署

## 前置知识

- Java、[Maven](https://maven.apache.org)
- [Spring Boot](https://spring.io)、JPA
- Database：SQL + MySQL / PostgreSQL / SQL Server / H2 / Oracle

## Spring Boot 部署（推荐）

> **如果你觉得麻烦，可在如下仓库中拉取已配置好的演示代码**
>
> 码云：[https://gitee.com/erupt/erupt-example](https://gitee.com/erupt/erupt-example)
>
> Github：[https://github.com/erupts/erupt-example](https://github.com/erupts/erupt-example)
>
> **注：不兼容 spring-boot-devtools，请勿添加此依赖**

### 1. 创建 Spring Boot 项目

前往 [Spring Initializr](https://start.spring.io)，目录结构如下：

```
demo -- 项目名称
├── src
│    └── main
│         ├── java -- 代码文件目录
│         │    └── com.example.demo -- 包名
│         │              └── DemoApplication -- 入口类
│         └── resources -- 资源文件目录
│                  └── application.properties -- 配置文件
├── ......
└── pom.xml -- Maven 依赖配置
```

### 2. 在 pom.xml 添加 erupt 依赖包

版本号详见：[更新日志](/guide/changelog)

```xml
<!--后端权限逻辑-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-admin</artifactId>
  <version>${erupt.version}</version>
</dependency>
<!--后台 WEB 界面，前后端分离场景，可不添加此依赖-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 3. 在资源目录下创建前端配置文件

| 文件位置 | 功能说明 |
| --- | --- |
| resources/public/app.js | 前端配置文件，可修改标题、Logo，页面生命周期函数等 |
| resources/public/app.css | 前端样式文件（可不创建） |
| resources/public/home.html | 前端首页布局（不创建，首页会出现 404） |

### 4. 在 application.yml 中添加数据库配置

示例数据库为 MySQL，其他数据库请参考：[数据源支持](/deployment/database)

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/erupt?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: mysql
```

> 注：空库即可，表结构会自动创建

### 5. 添加数据库驱动依赖

```xml
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
  <version>8.0.16</version>
  <scope>runtime</scope>
</dependency>
```

### 6. 入口类添加注解

```java
package com.example.demo;

@SpringBootApplication
@EntityScan
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 7. 启动项目

<!-- TODO: 添加截图 -->

### 8. 访问系统

启动成功后浏览器访问：`http://localhost:8080`

默认用户名密码：`erupt / erupt`（**为了您的系统安全请尽快修改默认密码**）

<!-- TODO: 添加截图 -->

## 源码启动

> 建议使用 jar 依赖形式运行 erupt 框架，源码启动适合体验与学习 erupt 原理的用户

1. 从 GitHub 或 Gitee 拉取 erupt 源码
2. 运行 `EruptSampleApplication` 的 `main` 方法，浏览器访问 http://127.0.0.1:8080 即可访问
3. 数据源为 H2 内嵌数据库所以不需要指定 IP，可根据实际需要调整为 MySQL、PG 等数据库

## Docker 启动

```bash
docker push erupts/erupt-cloud-server:version
```

镜像与版本信息：[https://hub.docker.com/repository/docker/erupts/erupt-cloud-server/general](https://hub.docker.com/repository/docker/erupts/erupt-cloud-server/general)

Docker 部署的为 erupt-cloud-server，可以开发 erupt-cloud-node 节点来实现分布式能力。

## 启动成功后无法登录

如果默认密码无法登录，请前往数据库查看是否有用户数据，如果表为空，在项目中找到 `.erupt` 文件夹，删除后重启即可。

详见：[常见问题 FAQ](/guide/faq)
