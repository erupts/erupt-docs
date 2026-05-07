# 部署 erupt-cloud-node（微节点）

## 部署 Node 节点

### 1. 创建 Spring Boot 项目

前往 [Spring Initializr](https://start.spring.io) 创建项目，目录结构如下：

```
demo -- 项目名称
├── src
│    └── main
│         ├── java -- 代码文件目录
│         │    └── com.example.demo -- 包名
│         │         └── DemoApplication -- 入口类
│         └── resources -- 资源文件目录
│                  └── application.properties -- 配置文件
├── ......
└── pom.xml -- Maven依赖配置
```

### 2. 添加 erupt-node 依赖

```xml
<!--cloud node 核心依赖-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-node</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

> **注意：** 微节点不要依赖 **erupt-admin** 和 **erupt-security**，保持最小依赖即可。

### 3. 配置

```yaml
erupt:
  cloud-node:
    # 必填: erupt-cloud-server 端部署地址
    server-addresses: ['http://localhost:9999']
    # 必填：从 server 端获取 access-token
    access-token: 9y1pa7eHksHWBTQC
    # 必填：应用名从 server 端获取，要与 server 端配置的一致
    node-name: nodeTest

    # 可选：当前 node 节点地址（非必填），如果网络环境复杂无法准确的发现 node 节点则需要配置此项
    host-address: ['xxx']
    # 可选：是否开启服务注册，默认值 true
    enable-register: true
    # 可选：心跳时间（毫秒），默认值 15000
    heartbeat-time: 15000
```

前往 server 端手动添加节点，并获取 access token。

<!-- TODO: 添加截图 -->

### 4. 在 Spring Boot 入口类增加 @EruptScan 注解

```java
@SpringBootApplication
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 5. 启动

<!-- TODO: 添加截图 -->

启动成功后 server 端会显示当前 node 节点实例数、erupt 类数量、版本等信息。

<!-- TODO: 添加截图 -->

## 开发 Node 节点

### 在 node 节点创建带有 erupt 注解的类

```java
package xyz.erupt.example.model;

import org.hibernate.annotations.GenericGenerator;
import xyz.erupt.annotation.Erupt;
import xyz.erupt.annotation.EruptField;
import xyz.erupt.annotation.sub_field.Edit;
import xyz.erupt.annotation.sub_field.View;

import javax.persistence.*;

/*
 * @Erupt 注解修饰在类上，@EruptField 注解修饰在字段上
 * 其他注解均为 JPA 注解
 */
@Erupt(name = "简单的例子")
@Table(name = "node_demo")
@Entity
public class NodeDemo extends BaseModel {

    // 文本输入
    @EruptField(
        views = @View(title = "文本"),
        edit = @Edit(title = "文本")
    )
    private String input;

    // 数值输入
    @EruptField(
        views = @View(title = "数值"),
        edit = @Edit(title = "数值")
    )
    private Integer number = 100; // 默认值 100
}
```

### 在 server 端菜单管理中关联 node erupt 实体

1. 前往系统管理 → 菜单维护 → 新增
2. 类型值：**xxx.NodeDemo**（格式：**节点名.类名**）

> 如果 NodeDemo 类所在节点名为 NodeTest，则类型值应该填：**NodeTest.NodeDemo**

<!-- TODO: 添加截图 -->

### 刷新页面即可看到在 node 节点配置的页面

<!-- TODO: 添加截图 -->

## 连接数据库使用 JPA 管理 Erupt 对象

### 1. 添加必要依赖

```xml
<!--JPA 数据源实现-->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-node-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
<dependency>
  <groupId>mysql</groupId>
  <artifactId>mysql-connector-java</artifactId>
  <scope>runtime</scope>
</dependency>
```

### 2. 添加数据库配置

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

## Node 节点使用 Excel 导入导出功能

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-excel</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Node 节点插件支持

> **注意：** 未提及的依赖勿引入，会带来期望之外的问题。

| 模块名 | 模块能力 |
| --- | --- |
| erupt-cloud-node | 微节点基础能力 |
| erupt-cloud-node-jpa | 数据库能力 |
| erupt-mongodb | mongodb 数据库能力 |
| erupt-excel | excel 导入导出能力 |
| erupt-tookit | 一些工具类，例如 choice 组件的 SQL 查询能力 |
| erupt-tenant-core | 多租户能力（未开源） |

## 附：在 node 节点获取 server 节点配置

```java
@Component
public class Fetch {

    @Resource
    private ServerRemoteService serverRemoteService;

    public void test() {
        // 获取当前登录用户数据
        MetaUserinfo metaUserinfo = serverRemoteService.getRemoteUserInfo();
        // 获取 Node 节点配置，配置位置：主节点 → 节点管理 → 节点配置
        String config = serverRemoteService.getNodeConfig();
        // 获取节点组配置，配置位置：主节点 → 节点组别 → 分组配置
        String groupConfig = serverRemoteService.getNodeGroupConfig();
    }
}
```
