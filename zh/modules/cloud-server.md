# Erupt Cloud Server

> 分布式节点管理中心。以数据库表替代传统配置中心的 yml 文件，通过可视化界面统一管理节点配置、服务注册与请求调度。

## 核心能力

传统微服务配置中心（Nacos、Apollo 等）依赖 yml/properties 文件管理配置，变更需重新发布或重启服务。Erupt Cloud 将配置存储于数据库表中，通过管理后台可视化编辑，节点实时拉取生效，无需维护额外的配置中心基础设施。

| 传统配置中心 | Erupt Cloud |
| --- | --- |
| yml / properties 文件 | 数据库表（可视化管理） |
| 需部署 Nacos / Apollo | 复用现有数据库即可 |
| 变更后需通知各节点刷新 | 节点主动拉取，实时生效 |
| 配置分散在各项目仓库 | 集中在 Server 端统一维护 |

## 使用方法

### 1. 创建 Erupt 项目

参考 [快速开始](/zh/guide/quick-start)

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
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
      port: 6379
      password:
erupt:
  redis-session: true
```

:::warning
Spring Boot 3 起 Redis 配置前缀为 `spring.data.redis.*`，旧的 `spring.redis.*` 已失效。
:::

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
    # 转发请求时是否同时附带明文 access-token，默认 true；所有节点都校验签名后可关闭（2.4.0+）
    plain-access-token: true
    # 转发到 node 节点的请求超时，单位：ms
    node-request-timeout: 30000
```

:::tip @EruptRouter(cloudProxy) <Badge type="tip" text="v2.3.0+" />
面向模块作者：默认情况下，Server 收到针对节点模型的 `/erupt-api/**` 请求后会转发给持有该模型的 Node 执行。若某个接口只以模型名作为键、逻辑完全属于 Server 端（例如记录评论——Node 既没有该模块，也不认识 Server 的用户），可标注 `@EruptRouter(cloudProxy = false)`：该接口永远不转发到 Node，由 Server 以 `nodeName.eruptName` 的形式自行处理。erupt-comment 正是借此让节点模型的记录也能携带评论。
:::

## 服务端代节点完成的工作 <Badge type="tip" text="v2.4.0+" />

节点只需实现协议中的基础接口（build、table、get、init-value、add、update、delete），其余由 Server 基于节点的构建模型完成。构建模型通过 Server 自己签名的 `GET /erupt-api/build/{erupt}` 拉取并缓存一分钟，**按用户语言分别缓存**：Java 节点会按请求携带的 `Lang` 翻译标题与选项标签，因此每种语言各有一份；[其他语言 SDK](/zh/modules/erupt-sdk/) 暂不翻译，各语言缓存内容相同。

### 转发前的校验

- **权限**：`@EruptRouter(power)` 声明的权限（新增、编辑 / 查看详情、删除、导出、导入）在转发前按用户的菜单权限校验，无权限直接返回标准的"权限不足"错误；返回给浏览器的 build 中 `power` 也按用户权限收窄。节点因此无需（也无法忘记）自行校验
- **请求体**：`@EruptRouter(payload)` 声明的查询或记录按节点的 build 校验。查询：条件只能落在可搜索字段且运算符合法，排序只能落在可排序列或主键，页大小不超过 1000；记录：非空、数值、文本长度、选项合法性、XSS，以及 `EruptValueValidator` 的全部声明限制，提示信息与本地模型一致
- **父模型担保**：从父模型菜单打开的嵌套模型（子表、标签页、引用）只有在父模型位于**同一节点**时才被放行，否则 404；嵌套关系本身由节点校验，因为只有它持有注解元数据

### 请求签名

每次转发都携带 `Erupt-Timestamp` 与 `Erupt-Signature`：`CloudSignature` 以节点的 access-token 为密钥，对方法、路径与查询串、时间戳、`Erupt-Enforced`、用户、请求体做 HMAC-SHA256，节点侧 300 秒内有效。`Erupt-Enforced` 头（`power` / `query` / `record`）告诉节点 Server 已完成的校验，节点可跳过对应检查；它被签名覆盖，节点只在签名通过后信任它。Server 自己发起的调用（`EruptRemoteRouter`，如 AI / MCP 工具、工作流）同样签名。

### 由 Server 直接应答的接口

以下接口 Server 根据节点的 build 自行回答，只通过节点已提供的基础接口读写数据，不要求节点实现：

| 功能 | 做法 |
|------|------|
| 引用标签 | 节点的行数据只带被引用主键，Server 对每个不同的主键读取一次被引用模型，补全为 `{id, label}` 对象与 `字段_列` 的扁平列 |
| 引用树、树模型、标签页树、复选框 | 从被引用模型的表格数据按 `referenceTreeType` / `tree` 的 `id` / `label` / `pid` 组装；带 `filter` 或 `orderBy` 的字段仍转发给节点 |
| Excel 模板 / 导出 / 导入 | 节点返回 404 时：模板按 build 生成，导出分页读取 table，导入逐行校验后调用 add，遇到失败行即停止并告知已导入的行数 |
| 附件上传、富文本图片 | 按字段的 `attachmentType` / `htmlEditorType` 存储在 **Server 端**，节点只保存返回的路径字符串；下载同样由 Server 提供 |
| 静态选项 | 未声明 `fetchHandler` 的 CHOICE / MULTI_CHOICE / TAGS 直接取 build 的 `componentValue`；声明了的转发给节点，404 时回退到 `componentValue` |
| 单元格编辑、批量编辑 | `update-cell` / `update-cells`：通过 get 读取整行、打补丁、按记录校验，再通过节点的 update 整行保存，节点的 DataProxy 照常执行 |
| 字段子模型 | `GET /erupt-api/build/{erupt}/{field}`：从 build 读取字段的 `fieldReturnName`，再拉取该模型的 build |
| 拖拽排序 | `drag-sort`：`{id: 位置}` 的每一行作为 `dragSort.field` 的一次单元格编辑 |
| 看板 / 日历 / 甘特写入 | 分组、日期、依赖关系的变更同样是读取整行、修改、整行保存；会形成环的甘特依赖被拒绝 |
| 依赖选择器 | `referenceTableType.dependField` 的选择器由 Server 把 `dependColumn = dependValue` 作为条件加入查询 |

### 节点能力与 invoke 接口

节点注册时可声明 `capabilities`，目前只有 `invoke`。声明了 `invoke` 的节点（如各语言 SDK）只需提供一个接口承载字段自己的代码：

```
POST /erupt-api/invoke/{erupt}/{kind}/{name}
```

`kind` 为 `options`（fetchHandler 取选项）、`onchange`、`autocomplete`、`button`、`operation`（行操作按钮）、`operation-form`（操作表单初值），Server 把浏览器的对应请求转换为这一个调用；引用选择器则交由 Server 读取。未声明 `invoke` 的节点（Java 节点）仍收到原有的 `comp/choice-item`、`data/onchange`、`comp/button`、`data/{erupt}/operator/{code}` 等接口。

:::info 协议规范与多语言 SDK
完整的线上协议见 [erupt-cloud/PROTOCOL.md](https://github.com/erupts/erupt/blob/develop/erupt-cloud/PROTOCOL.md)，随 erupt 生成的 JSON Schema 在 `schema/erupt-annotations.schema.json` 与 `schema/erupt-node-defaults.json`。基于它们实现的 Python、Go、TypeScript、PHP、.NET 节点 SDK 见 [erupt-sdk](https://github.com/erupt-io/erupt-sdk)；JVM 上的非 Spring 节点见 [轻量节点 Node Lite](/zh/modules/cloud-node-lite)。
:::

## Docker 部署

Server 端支持 Docker 方式部署，新功能仅需开发 Node 节点即可：

```bash
docker pull erupts/erupt:version
```

镜像版本同 Erupt 版本号，版本信息：[https://hub.docker.com/repository/docker/erupts/erupt/general](https://hub.docker.com/repository/docker/erupts/erupt/general)

可参照 [更新日志](/zh/guide/changelog) 获取最新版本号。
