# 架构图

<img src="/architecture/overview.jpeg" width="900">

## 功能导图

<img src="/architecture/feature-map.jpeg" width="900">

## 功能架构

<img src="/architecture/arch.png" width="900">

---

## 分层架构

Erupt 采用分层模块化设计，各层职责清晰，按需引入。

```mermaid
graph TB
    subgraph 前端层
        Web["erupt-web\nAngular 管理界面（Jar 分发）"]
    end

    subgraph 安全层
        Security["erupt-security\nJWT / Session 认证鉴权"]
    end

    subgraph 核心层
        Core["erupt-core\n注解解析 · CRUD 引擎 · Schema 下发"]
        UPMS["erupt-upms\n用户 · 角色 · 菜单 · 组织"]
    end

    subgraph 数据层
        JPA["erupt-jpa\nSpring Data JPA · 多数据源 · 自动建表"]
        Mongo["erupt-mongodb\nMongoDB NoSQL"]
    end

    subgraph 扩展层
        Job["erupt-job\n定时任务"]
        Notice["erupt-notice\n消息通知"]
        Monitor["erupt-monitor\n服务监控"]
        Tpl["erupt-tpl\n自定义页面"]
        Cloud["erupt-cloud\n分布式"]
        AI["erupt-ai\nAI 大模型"]
    end

    Web --> Security
    Security --> Core
    Core --> UPMS
    Core --> JPA
    Core --> Mongo
    Core -.-> Job & Notice & Monitor & Tpl & Cloud & AI
```

## 请求生命周期

一次 CRUD 请求在框架内的完整处理流程：

```mermaid
sequenceDiagram
    participant C as 浏览器
    participant S as erupt-security
    participant R as erupt-core
    participant P as DataProxy
    participant D as 数据库

    C->>S: HTTP 请求 + Token
    S->>S: Token 校验 / 权限验证
    S->>R: 路由到对应 Erupt 类
    R->>R: 解析 @Erupt / @EruptField 元数据
    R->>R: 行列权限过滤
    R->>P: beforeFetch / validate / beforeAdd…
    P-->>R: 动态条件 / 数据修改 / 校验拒绝
    R->>D: JPQL / SQL 执行
    D-->>R: 返回结果
    R->>P: afterFetch / afterAdd…
    R-->>C: JSON 响应
```

## DataProxy 生命周期

DataProxy 是 Erupt 的 Service 层，覆盖增删改查全部生命周期钩子：

```mermaid
flowchart TD
    Req[前端请求] --> T{操作类型}

    T -- 查询 --> BF["beforeFetch()\n注入动态 WHERE 条件"]
    BF --> Q[(数据库查询)]
    Q --> AF["afterFetch()\n结果后置处理 / 单元格着色"]

    T -- 新增 --> V1["validate()\n数据校验"]
    V1 --> BA["beforeAdd()\n写入前 · 自动填充"]
    BA --> INS[(INSERT)]
    INS --> AA["afterAdd()\n写入后 · 消息推送 / 缓存更新"]

    T -- 修改 --> V2["validate()"]
    V2 --> BU["beforeUpdate()"]
    BU --> UPD[(UPDATE)]
    UPD --> AU["afterUpdate()"]

    T -- 删除 --> BD["beforeDelete()"]
    BD --> DEL[(DELETE)]
    DEL --> AD["afterDelete()"]
```

## 注解驱动原理

从一个 Java 类到完整后台管理页面的自动化过程：

```mermaid
flowchart LR
    A["@Erupt 实体类\n@EruptField 字段"] -->|启动时扫描| B["EruptCoreService\n元数据注册中心"]
    B --> C["EruptModel\n字段·视图·编辑·搜索·权限配置"]
    C --> D["REST API 自动生成\n/erupt-api/data/*"]
    C --> E["Schema 下发前端\n自动渲染表格 / 表单 / 搜索栏"]
    C --> F["权限控制\n菜单级 · 行级 · 列级 · 按钮级"]
    D & E & F --> G[✅ 完整后台管理页面]
```

## 模块依赖关系

```mermaid
graph LR
    admin["erupt-admin\n推荐引入"] --> upms["erupt-upms"]
    admin --> security["erupt-security"]
    admin --> web["erupt-web"]
    upms --> core["erupt-core"]
    security --> core
    core --> jpa["erupt-jpa"]

    job["erupt-job"] --> core
    notice["erupt-notice"] --> core
    notice --> ws["erupt-websocket"]
    monitor["erupt-monitor"] --> core
    tpl["erupt-tpl"] --> core
    magic["erupt-magic-api"] --> core
    ai["erupt-ai"] --> core

    node["erupt-cloud-node"] --> core
    server["erupt-cloud-server"] --> admin
```

## 分布式架构（erupt-cloud）

```mermaid
graph TB
    Browser["管理员浏览器"] --> Server

    subgraph Server端
        Server["erupt-cloud-server\n注册中心 · 权限中心 · 请求调度"]
        Redis[("Redis\nSession 共享")]
        Server --- Redis
    end

    Server <-->|"WebSocket 心跳\n配置下发 / 请求转发"| NA
    Server <-->|"WebSocket 心跳"| NB
    Server <-->|"WebSocket 心跳"| NC

    subgraph "Node 节点 A（通知服务）"
        NA["erupt-cloud-node\n通知模板 · 渠道配置"]
        DBA[("DB-A")]
        NA --- DBA
    end

    subgraph "Node 节点 B（网关服务）"
        NB["erupt-cloud-node\n超时 · 限流 · 转发规则"]
        DBB[("DB-B")]
        NB --- DBB
    end

    subgraph "Node 节点 C（算法服务）"
        NC["erupt-cloud-node\nPrompt · 算法规则"]
        DBC[("DB-C")]
        NC --- DBC
    end
```
