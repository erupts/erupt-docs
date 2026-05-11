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

### 1. 一键生成项目

前往 **[https://start.erupt.xyz](https://start.erupt.xyz)**，按需选择模块、数据库和版本，点击「生成项目」下载压缩包并解压。

项目目录结构如下：

```
demo -- 项目名称
├── src
│    └── main
│         ├── java -- 代码文件目录
│         │    └── com.example.demo -- 包名
│         │              └── DemoApplication -- 入口类
│         └── resources -- 资源文件目录
│                  ├── public
│                  │    ├── app.js    -- 前端配置（标题、Logo 等）
│                  │    └── home.html -- 首页布局
│                  └── application.yml -- 配置文件
└── pom.xml -- Maven 依赖配置
```

> **注：不兼容 spring-boot-devtools，请勿添加此依赖**

### 2. 配置数据库连接

打开 `src/main/resources/application.yml`，修改数据库连接信息：

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

> 注：空库即可，表结构会自动创建。其他数据库请参考：[数据源支持](/guide/database)

### 3. 启动项目

使用 `mvn spring-boot:run` 或 `gradle bootRun` 启动项目。

### 4. 访问系统

启动成功后浏览器访问：`http://localhost:8080`

默认用户名密码：`erupt / erupt`（**为了您的系统安全请尽快修改默认密码**）

## 手动集成（已有项目）

如需将 erupt 集成到现有 Spring Boot 项目，按以下步骤操作。

### 1. 添加依赖

版本号详见：[更新日志](/guide/changelog)

```xml
<!--后端权限逻辑-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-admin</artifactId>
  <version>${erupt.version}</version>
</dependency>
<!--后台 WEB 界面，前后端分离场景可不添加-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 2. 入口类添加注解

```java
@SpringBootApplication
@EntityScan
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 3. 创建前端配置文件

| 文件位置 | 说明 |
| --- | --- |
| `resources/public/app.js` | 前端配置，可修改标题、Logo、生命周期函数等 |
| `resources/public/app.css` | 前端样式（可选） |
| `resources/public/home.html` | 首页布局（不创建则首页 404） |

### 4. 配置数据库并启动

参考上方「Spring Boot 部署」第 2～4 步完成数据库配置并启动。

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

## 下一步

项目启动成功后，前往 [入门示例](/guide/getting-started) 了解如何用一个 Java 类创建你的第一个管理页面。
