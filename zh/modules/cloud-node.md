# Erupt Cloud Node

> 分布式微节点，向 Cloud Server 注册并接受其调度，同时通过 Server 端的数据库配置替代本地 yml 配置文件。

## 部署 Node 节点

### 1. 创建 Spring Boot 项目

前往 [Spring Initializr](https://start.spring.io) 创建项目。

### 2. 添加 erupt-node 依赖

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-cloud-node</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

:::warning
微节点不要依赖 `erupt-admin` 和 `erupt-security`，保持最小依赖即可。
:::

### 3. 配置

```yaml
erupt:
  cloud-node:
    # 必填：erupt-cloud-server 的部署地址
    server-addresses: ['http://localhost:9999']
    # 必填：从 server 端获取的 access-token
    access-token: 9y1pa7eHksHWBTQC
    # 必填：节点名称，需与 server 端配置一致
    node-name: nodeTest

    # 可选：当前 node 节点地址，网络环境复杂时需显式配置
    host-address: ['xxx']
    # 可选：是否开启服务注册，默认 true
    enable-register: true
    # 可选：心跳时间（毫秒），默认 15000
    heartbeat-time: 15000
    # 可选：拒绝没有有效 Erupt-Signature 的服务端调用，默认 false（2.4.0+）
    require-signature: false
```

在 Server 端手动添加节点：

<img src="/cloud/node-add.png" width="900">

获取 access-token（需分配令牌查看权限）：

<img src="/cloud/node-token.png" width="900">

### 4. 添加 @EruptScan 注解

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

<img src="/cloud/node-start.png" width="900">

启动成功后，Server 端显示当前节点实例数、Erupt 类数量、版本等信息：

<img src="/cloud/node-registered.png" width="900">

## 在 Node 节点创建 Erupt 实体

```java
@Erupt(name = "简单的例子")
@Table(name = "node_demo")
@Entity
public class NodeDemo extends BaseModel {

    @EruptField(
        views = @View(title = "文本"),
        edit = @Edit(title = "文本")
    )
    private String input;

    @EruptField(
        views = @View(title = "数值"),
        edit = @Edit(title = "数值")
    )
    private Integer number = 100;
}
```

## 在 Server 端关联 Node 实体

1. 进入系统管理 → 菜单维护 → 新增
2. 类型值填写格式：`节点名.类名`，例如节点名为 `NodeTest`，则填 `NodeTest.NodeDemo`

<img src="/cloud/menu-config.png" width="900">

刷新页面即可看到 Node 节点配置的页面：

<img src="/cloud/node-page.png" width="900">

## 连接数据库（JPA）

### 1. 添加依赖

```xml
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

## Node 节点插件支持

:::warning
未提及的依赖勿引入，可能引发意外问题。
:::

| 模块名 | 能力说明 |
| --- | --- |
| erupt-cloud-node | 微节点基础能力 |
| erupt-cloud-node-jpa | 数据库（JPA）能力 |
| erupt-data-mongodb | MongoDB 数据库能力 |
| erupt-excel | Excel 导入导出能力 |
| erupt-toolkit | 工具类（如 choice 组件的 SQL 查询能力） |
| erupt-tenant-core | 多租户能力（未开源） |

## 注册地址与签名校验 <Badge type="tip" text="v2.4.0+" />

- **注册地址**：未配置 `host-address` 时，节点以**实际绑定的端口**（而非 `server.port` 的配置值，随机端口同样适用）和 `server.servlet.context-path` 向 Server 注册，Server 直接按该地址回调。Solon / Quarkus / Micronaut 的轻量节点同样会注册各自的上下文路径
- **签名校验**：Server 的每次调用都带有 HMAC-SHA256 签名，`NodeSignatureFilter` 对 `/erupt-api/**` 逐一校验，签名无效返回 403。`erupt.cloud-node.require-signature: true` 后，仅携带明文 access-token 的调用也会被拒绝；Server 端对应关闭 `erupt.cloud-server.plain-access-token`
- **跳过权限回调**：Server 已在转发前校验用户权限时会在签名内声明 `Erupt-Enforced: power`，节点不再回调 Server 查询权限；模型自身声明的 `@Power` 仍由节点执行。详见 [服务端代节点完成的工作](/zh/modules/cloud-server#服务端代节点完成的工作)

## 非 Spring 技术栈与多语言 SDK

本页的 `erupt-cloud-node` 是 Spring Boot 模块。其他技术栈请使用：

- **[轻量节点 Node Lite](/zh/modules/cloud-node-lite)**：纯 Java / Kotlin、Solon、Quarkus、Micronaut、Vert.x、Ktor 或任意 Servlet 容器，运行期只依赖 `erupt-annotation`、`erupt-cloud-common`、`linq.j`，模型注解与本页完全一致
- **[erupt-sdk](/zh/modules/erupt-sdk/)**：Python、Go、TypeScript、PHP、.NET、Rust、Ruby、Swift 的节点 SDK，基于 [节点协议规范](https://github.com/erupts/erupt/blob/develop/erupt-cloud/PROTOCOL.md) 与随 erupt 生成的 JSON Schema（`schema/erupt-annotations.schema.json` 描述注解结构，`schema/erupt-node-defaults.json` 给出每种编辑类型的默认字段 JSON）实现

## 从 Server 端拉取配置（替代 yml 配置中心）

Node 节点可主动向 Server 端拉取存储在数据库中的配置内容，以此替代传统配置中心的 yml 文件。配置在管理后台可视化编辑，无需修改代码或重启服务即可生效。

**配置入口：**
- 节点级配置：管理后台 → 节点管理 → 节点配置
- 分组级配置：管理后台 → 节点组别 → 分组配置

```java
@Component
public class Fetch {

    @Resource
    private ServerRemoteService serverRemoteService;

    public void fetchConfig() {
        // 获取当前登录用户信息
        MetaUserinfo metaUserinfo = serverRemoteService.getRemoteUserInfo();
        // 拉取节点级配置（对应 Server 端节点管理中的"节点配置"字段）
        String config = serverRemoteService.getNodeConfig();
        // 拉取分组级配置（对应 Server 端节点组别中的"分组配置"字段）
        String groupConfig = serverRemoteService.getNodeGroupConfig();
    }
}
```

:::tip
配置内容格式不限，推荐使用 JSON 或 YAML 字符串，由业务代码自行解析。
:::
