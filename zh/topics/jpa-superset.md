---
title: "当 MyBatis-Plus 还在卷 SQL DSL，Erupt 给 JPA 加了一整圈后台基础设施"
description: 一个 @Entity，在 Erupt 体系里能长出 10 种身份——UI、RBAC、REST API、Auto DDL、i18n、DataProxy、Lambda、AI、Flow、Cloud。
outline: deep
---

# 第 03 期 · 当 MyBatis-Plus 还在卷 SQL DSL，Erupt 给 JPA 加了一整圈后台基础设施

> 一个 `@Entity`，在 Erupt 里能长出 **UI / RBAC / REST API / Auto DDL / i18n / DataProxy / Lambda 查询 / AI Agent / 流程引擎 / 跨服务聚合** 10 种身份。
>
> _发布于 2026-05-25 · 阅读 ~10 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

## 一、不是 JPA-Plus

熟悉国内 Java 生态的同学，看到"JPA 增强"四个字会先想到一件事——**MyBatis-Plus**。

它在 MyBatis 之上加了 `LambdaQueryWrapper`、自动填充、逻辑删除、代码生成器，一举成为国内 ORM 派的天花板。

所以国内开发者天然会问：

> Erupt 既然押注 JPA，那它是不是 "JPA-Plus"？

不是。我们的赌注更大——

**Erupt 不是 JPA 的增强，是 JPA 的超集。**

MyBatis-Plus 解决"少写 SQL"这一件事，已经做到天花板。但**写后台 80% 的工作量根本不在写 SQL，而在写 SQL 周围的那一圈基础设施**——UI、权限、API、建表、国际化、AI、审批、跨服务聚合……

我们押注的就是这一圈。

## 二、一张表看清：一个 `@Entity` 在 Erupt 里能干 10 件事

先把全景图摆出来——下面这 10 行，每一行都是同一份 JPA 实体在 Erupt 体系里"长出"的一种身份：

| # | 能力 | 是怎么挂上来的 |
| --- | --- | --- |
| 1 | **UI 渲染**（Table / Form） | [`@EruptField`](/zh/annotation/erupt-field) · 30 种 [`EditType`](/zh/field-types/) |
| 2 | **RBAC 权限** | [`@Power`](/zh/annotation/power) 8 个开关 + `PowerHandler` 动态权限 |
| 3 | **REST API**（自动） | `EruptDataController` 在 `/erupt-api/data/*` 自动暴露 |
| 4 | **Auto DDL** | Hibernate `ddl-auto: update`，注解改 → 表结构改 |
| 5 | **i18n**（12 种语言） | [`I18nTranslate.$translate(key)`](/zh/advanced/i18n) + CSV 词典 |
| 6 | **DataProxy 业务钩子** | [`beforeAdd / afterAdd / ...` 10+ 钩子](/zh/advanced/data-proxy) |
| 7 | **Lambda 查询** | [`EruptLambdaQuery<T>`](/zh/advanced/erupt-dao-lambda) 类型安全 DSL |
| 8 | **AI Agent** | [`erupt-ai-claw`](/zh/modules/erupt-ai-claw) 引入即用，LLM 零代码 CRUD |
| 9 | **审批流** | [`@EruptFlow`](/zh/modules/pro/erupt-flow) 实体即流程载体 |
| 10 | **跨服务聚合** | [`erupt-cloud-node-jpa`](/zh/modules/cloud-node) 心跳上报中央 admin |

下面分三组讲清楚——**写注解就有的 4 件、写少量代码扩展的 3 件、AI 时代杀手 3 件**，最后再补一个永远不会出错的兜底层。

## 三、基础四件套：UI / RBAC / REST API / Auto DDL —— 写注解就有

这一组最朴素，但是 80% 后台需要的"地基"。看个最小例子：

```java
@Erupt(name = "客户", power = @Power(export = true, importable = true))
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(views = @View(title = "客户名"),
                edit = @Edit(title = "客户名", notNull = true, search = @Search))
    private String name;

    @EruptField(views = @View(title = "等级"),
                edit = @Edit(title = "等级", type = EditType.CHOICE,
                    choiceType = @ChoiceType(vl = {
                        @VL(value = "A", label = "A 类"),
                        @VL(value = "B", label = "B 类")
                    })))
    private String level;
}
```

启动后**直接获得 4 件事**，且**全部不需要写任何前端、Controller、Service、SQL 脚本**：

**1. UI 渲染**——列表页、新建 / 编辑表单、Excel 导入导出、搜索、排序、批量操作、关联懒加载，全部由 [`@EruptField`](/zh/annotation/erupt-field) 驱动。[`EditType`](/zh/field-types/) 提供 30 种字段类型，从最朴素的 [`INPUT`](/zh/field-types/input) / [`NUMBER`](/zh/field-types/number) / [`DATE`](/zh/field-types/date) 到 [`HTML_EDITOR`](/zh/field-types/html-editor) / [`CODE_EDITOR`](/zh/field-types/code-editor) / [`MARKDOWN`](/zh/field-types/markdown) / [`MAP`（地图）](/zh/field-types/map) / [`SIGNATURE`（手写签名）](/zh/field-types/signature) / [`REFERENCE_TREE`](/zh/field-types/reference-tree) / [`REFERENCE_TABLE`](/zh/field-types/reference-table)——后台需要的字段输入器全在这了。

**2. RBAC 权限**——[`@Power`](/zh/annotation/power) 8 个独立开关：`add / edit / delete / query / viewDetails / export / importable / print`。可以让客服只能 query、财务只能 export、管理员才有 delete。8 个静态开关不够用？挂一个 `PowerHandler`，里面就是普通 Spring Bean，`@Autowired` 拿 `RoleService` / `TenantContext` 都行——**动态权限不是 SaaS 后台拖一下，而是 6 行 Java**。

**3. REST API 自动**——`EruptDataController`（`erupt-core/.../controller/EruptDataController.java`）在 `/erupt-api/data/*` 路径下自动挂 6 个核心端点：

```
POST /erupt-api/data/table/{erupt}                列表分页查询（含搜索条件）
GET  /erupt-api/data/{erupt}/{id}                 按主键查
GET  /erupt-api/data/tree/{erupt}                 树形数据
GET  /erupt-api/data/init-value/{erupt}           新建初始值
POST /erupt-api/data/{erupt}/operator/{code}      自定义按钮
GET  /erupt-api/data/{erupt}/reference-table/{f}  关联表查询
```

加上 `EruptModifyService` 暴露的 insert / update / delete，**RESTful 后端零代码**——Postman 直接打这些路径就能 CRUD。

**4. Auto DDL**——`application.yml` 设 `hibernate.ddl-auto: update`，加字段、改类型、加索引——重启即同步表结构。**开发期一份 SQL 脚本都不用写**，直接改 Java 注解。详见 [数据源支持](/zh/guide/database)。

这一层的工程性质是：**Erupt 把"后台的地基"压进了元数据**。元数据 = UI = 权限 = API = 表结构，四者同源，改一处即全部同步。这是 MyBatis-Plus 和 Spring Data JPA 都没碰过的领域。

## 四、进阶三件套：i18n / DataProxy / Lambda —— 写少量代码扩展

### i18n（12 种语言开箱即用）

> 详见文档：[国际化](/zh/advanced/i18n)

源码：`erupt-core/src/main/resources/i18n/erupt.i18n.csv`。CSV 一行一个 key，列对应 12 种语言：

```csv
key,zh-CN,zh-TW,en-US,fr-FR,ja-JP,ko-KR,ru-RU,es-ES,de-DE,pt-PT,id-ID,ar-SA
```

代码里 `I18nTranslate.$translate("erupt.exec_success")` 拿当前用户语言对应文案；注解上 `@Edit(title = "{customer.name}")` 用 `{key}` 占位，渲染时自动替换。**一份 csv 同时管前端文案 + 后端报错 + 注解标题**——SaaS 化最常被卡住的国际化，在 Erupt 里几乎是 0 成本。

### DataProxy（service 层钩子）

> 详见文档：[数据代理 DataProxy](/zh/advanced/data-proxy)

绝大多数后台框架到了"业务逻辑往哪写"这个问题都会变得难看——MyBatis 让你写 mapper + service + interceptor 三层、JeecgBoot 让你改生成出来的 service 类、SaaS 派让你在画布里写 JS 片段。

Erupt 给的答案是 **`DataProxy<T>`**——一个普通 Spring Bean：

```java
@Service
public class CustomerProxy implements DataProxy<Customer> {

    @Override
    public void beforeAdd(Customer model) { /* 校验 / 默认值 */ }

    @Override
    @Transactional
    public void afterUpdate(Customer model) { /* 审计日志 */ }

    @Override
    public String beforeFetch(List<Condition> conditions) {
        return "ownerId = " + MetaContext.getUser().getId();   // 👈 行级权限
    }
}
```

[`@Erupt(dataProxy = CustomerProxy.class)`](/zh/annotation/erupt) 引用即生效。10+ 钩子覆盖增删改查全生命周期 + Excel 导入导出 + 字段校验。

它和画布派"在事件面板写 JS"的本质区别是——**这段代码跟你 service 层共享同一个事务管理器、同一个安全上下文、同一份单元测试**。能 `@Autowired` 拿任何依赖，能打 `@Transactional` 和 `@PreAuthorize`，能 IDE 重构，能 PR 走 code review。

### Lambda 查询：条件分支零样板

> 详见文档：[数据库操作 EruptDao](/zh/advanced/erupt-dao)

```java
eruptDao.lambdaQuery(Customer.class)
    .like(StringUtils.isNotBlank(q.getName()), Customer::getName, q.getName())
    .ge(q.getMinAmount() != null, Customer::getAmount, q.getMinAmount())
    .in(q.getLevels() != null, Customer::getLevel, q.getLevels())
    .between(q.getStartDate() != null,
             Customer::getCreateDate, q.getStartDate(), q.getEndDate())
    .orderByDesc(Customer::getCreateDate)
    .page(q.getLimit(), q.getOffset());
```

请重点看每一行第一个参数——

`StringUtils.isNotBlank(q.getName())`、`q.getMinAmount() != null`……

这是 `EruptLambdaQuery` 工程上很爽的一个设计：**所有 where 类方法都有 `(boolean condition, ...)` 重载**。意思是"参数为空就不加这个条件"再也不用 `if`，**6 个条件 6 行链式调用就完事**。

方法清单：`eq / ne / gt / lt / ge / le / between / notBetween / in / notIn / like / likeValue / isNull / isNotNull / orderBy / orderByAsc / orderByDesc / with（JOIN 预加载）`，结果集 `one / list / count / page / oneSelect / listSelect / listSelects`。

源码：`erupt-data/erupt-jpa/.../EruptLambdaQuery.java`

## 五、杀手锏一：[`erupt-ai-claw`](/zh/modules/erupt-ai-claw) —— LLM 零代码 CRUD 全实体

这是 Erupt 在 JPA 之上做的**最反直觉**的一件事——

**让 LLM 通过自然语言直接 CRUD 你的任何 `@Erupt` 实体，而你不需要写一行额外代码。**

不是"画一个聊天框给运营"，不是"在表单字段挂一个 AI 建议按钮"，更**不是让你为每张表写一个 `@AiToolbox` 工具类**。是真正的：

> 引入 `erupt-ai-claw` 依赖，运营在 admin AI Chat 里说"**查张三上周的订单，把'待审批'的都改成'已通过'**"——LLM 自动发现你的实体、读 schema、跑 HQL，背后真的查 JPA、改字段、走权限校验、提交事务。

### 引入 jar，结束

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-claw</artifactId>
</dependency>
```

完。**项目里所有 `@Erupt` 实体立刻被 LLM 接管**——新加实体、改字段，0 配置同步生效。

### 它为什么不需要你写代码？

源码 `erupt-ai-claw/.../tool/EruptModelTools.java`：

```java
@AiToolbox
@Component
public class EruptModelTools {

    @Tool("Erupt data model list")
    public String eruptModelList() {
        for (EruptModel erupt : EruptCoreService.getErupts()) { /* ... */ }
    }

    @Tool("Erupt data model schema")
    public String eruptSchema(String eruptName) {
        return GsonFactory.getGson().toJson(EruptCoreService.getEruptView(eruptName));
    }

    @Tool("Query erupt model data ... SELECT only")
    public String eruptDataQuery(String hql) {
        return GsonFactory.getGson().toJson(
            eruptDao.getEntityManager().createQuery(hql).setMaxResults(200).getResultList());
    }

    @Tool("Insert / Update / Delete erupt data ...")
    public String insertEruptData(String eruptName, Map<String, Object> data) { /* ... */ }
    // ... 还有 findEruptDataByPk / updateEruptData / deleteEruptData
}
```

注意——8 个 `@Tool` 方法**全部是泛型**，不针对任何具体实体。底层是 3 个泛型服务：`EruptCoreService` 拿元数据图、`EruptModifyService` 走泛型增删改、`EruptDataController` 走泛型查询。

新加一个 `@Erupt` 实体？LLM 立刻就认识。**因为元数据 = LLM Tool**。

而且 `ClawSystemPrompt` 已经把工作流提示词预置好了：

> When operating on Erupt model data: always call `eruptModelList` first if the target model is unknown, call `eruptSchema` before any read or write to confirm field names, for updates call `findEruptDataByPk` first to retrieve the current record ...

**用户既不用写工具、也不用写 prompt**。

### 三道安全闸

LLM 直接 CRUD 数据库听起来很危险，所以 Erupt 给了三道闸——

1. **HQL 强制 SELECT only**：`eruptDataQuery` 在工具描述里就写明 `INSERT/UPDATE/DELETE/DROP/TRUNCATE are strictly forbidden`，LLM 自己看到这条规则
2. **写操作走 `@Power` RBAC**：`insertEruptData / updateEruptData / deleteEruptData` 内部走 `EruptModifyService`，跟运营手动点"新建"按钮走同一套权限闸门——你给 `@Power(delete = false)` 的实体，LLM 也删不了
3. **角色级 Tool 权限**：`LLMRoleService.getAllowedToolsByUid(...)` 按角色过滤可调 Tool，普通员工只能调读 Tool，管理员才能调写 Tool

底层 [`erupt-ai`](/zh/modules/erupt-ai) 模块自带 17 个 LLM provider——ChatGPT / Claude / DeepSeek / Gemini / Grok / Qwen / Moonshot / Ollama / OpenAI 兼容协议……admin 里一键切换，**今天 DeepSeek 跑 demo、明天 Ollama 跑生产，业务代码不动**。

这一层的工程性质是——**AI 不是另一个独立服务、不是聊天框、不是浮层。它是 `@Erupt` 元数据图直接喂给 LLM**。元数据 = UI = LLM Tool，三者同源，所以 LLM 接管 admin 不需要额外代码。

## 六、杀手锏二：[`@EruptFlow`](/zh/modules/pro/erupt-flow) —— 实体即审批流载体

绝大多数后台系统都有审批流——请假、订单变更、合同审批、客户调级。

传统方案是引入 Activiti / Flowable / Camunda。它们的痛点是**数据模型双轨**：流程引擎在自己的 `act_*` 表里，业务实体在自己的 `t_order` 表里，两边靠 `businessKey` 字符串关联。每次想"在订单详情看审批进度"，都要写 join 桥接。

Erupt 反过来——**业务实体本身就是流程实例的载体**：

```java
@Erupt(name = "请假申请")
@EruptFlow(flowProxy = LeaveFlowProxy.class)   // 👈 一行注解，进入流程
@Entity
public class LeaveApplication extends BaseModel {
    private String applicant;
    private Integer days;
    private String status;
}
```

启动后这条实体就自动有了：admin 表单 / 列表多出"流程进度"按钮 / 审批人在"待办"里看到这条记录 / 节点切换时回调 `LeaveFlowProxy`。

`FlowProxy` 三个钩子（`onNodeStart` / `onNodeEnd` / `onReject`）是普通 Spring Bean，能 `@Autowired` 拿 `EruptDao` 直接改业务实体状态、调 `NoticeService` 推钉钉——**审批结果联动业务数据 0 重复代码**。

核心数据模型 `EruptFlowInstance` 里有两个关键字段：`erupt`（实体类名）+ `eruptModelId`（实体主键）。**流程实例直接知道自己绑的是哪行 JPA 数据**，不再有 `businessKey` 字符串桥接。

我们不是说 Activiti 不行——做严格 BPMN 兼容、跨系统流程标准化时它仍然是首选。但 80% 的内部审批场景根本用不到 BPMN，要的只是"请假单 → 上级 → 审批"这种三五个节点的流转。

**Erupt Flow 的赌注是：这 80% 场景里，业务模型不应该为流程模型让步。**

## 七、杀手锏三：[`erupt-cloud`](/zh/modules/erupt-cloud) —— 微服务 JPA 远程聚合

到了 10 件事中信息量最大的一件。

讲个场景——你有 10 个微服务，每个 5-10 个 JPA 实体，运营要在一个统一 admin 里管所有数据。怎么办？

传统方案有两种：

**A. 所有 JPA 实体合并到一个 admin 工程**——10 个服务的 `@Entity` 全部 copy 到 `admin-aggregator`，连 10 个数据源。代价：依赖冲突、字段定义漂移、每次微服务改字段都要同步 admin。

**B. 每个微服务自己写 admin**——10 个独立后台。代价：登录态不通、菜单不统一、运营要打开 10 个 URL。

Erupt 给的第三种方案——

```
┌────────── erupt-cloud-server（中央 admin）──────────┐
│         无业务数据，只聚合 @Erupt 元数据              │
└──────┬─────────────┬─────────────┬───────────────────┘
       │心跳         │心跳         │心跳
   ┌───▼───┐    ┌────▼───┐    ┌────▼───┐
   │ Order │    │ User   │    │ Stock  │
   │ + JPA │    │ + JPA  │    │ + JPA  │
   │ + Node│    │ + Node │    │ + Node │
   └───────┘    └────────┘    └────────┘
```

每个微服务引入 [`erupt-cloud-node-jpa`](/zh/modules/cloud-node)，**保留自己独立的 JPA 实体和数据库**，但在启动时把 `@Erupt` 注解的元数据（菜单、字段、权限）通过 HTTP 心跳上报到 [cloud-server](/zh/modules/cloud-server)。

配置在 `erupt.cloud-node`：

```yaml
erupt:
  cloud-node:
    node-name: order-service
    access-token: ${ERUPT_CLOUD_TOKEN}
    server-addresses: [https://admin.company.com]
    heartbeat-time: 15000
```

运营打开中央 admin 看到的是这样的菜单——

```
📋 订单管理    └ 订单列表（来自 Order 节点 t_order）
👥 用户管理    └ 用户列表（来自 User 节点 t_user）
📦 库存管理    └ SKU 列表（来自 Stock 节点 t_sku）
```

点"订单列表"，cloud-server 透明地把请求转发到 Order 节点，节点用自己的 `EruptDao.lambdaQuery(Order.class)` 查自己的数据库，再返回。

**整个过程对运营透明、对工程师也透明**——

- 运营看到一个统一 admin、一份菜单、一次登录
- 工程师在自己的微服务里写 `@Entity` + `@Erupt`，跟单体应用一模一样
- 节点之间不互相依赖，节点和 server 之间通过 HTTP + accessToken 通信

工程价值是——**节点是真理来源，server 只是聚合视图**。微服务改字段无需同步 admin、新服务接入即出现、字段不漂移。

如果你做 SaaS 平台、做 ToB 多产品矩阵、做内部多团队中台——这一层是杀手锏。

## 八、兜底：[多数据源](/zh/advanced/datasource) + JdbcTemplate

JPA 写多了的人都遇过同一个尴尬时刻：

> 这个查询用 JPA 写出来比 SQL 还长，或者跑出来的 SQL 完全不是我想要的。

`EruptDao` 同时持有 `EntityManager` + `JdbcTemplate` + `NamedParameterJdbcTemplate`：

```java
eruptDao.find(Customer.class, 1L);                                      // JPA
eruptDao.lambdaQuery(Customer.class).eq(Customer::getName, "A").one();  // Lambda
eruptDao.getJdbcTemplate().queryForList("select ...");                  // 原生 SQL
eruptDao.getEntityManager("report");                                    // 多数据源
```

四种姿势都是 Spring 生态最原生的写法——**用了 JPA 不代表锁死了**。详见 [数据库操作 EruptDao](/zh/advanced/erupt-dao) 和 [多数据源](/zh/advanced/datasource)。

## 九、对位竞品

| 维度 | **MyBatis-Plus** | **Spring Data JPA** | **Erupt JPA** |
| --- | --- | --- | --- |
| 核心增强 | SQL DSL | Repository pattern | **JPA → 10 种身份超集** |
| UI 渲染 | 无 | 无 | **30 种 EditType** |
| RBAC 权限 | 无 | 无 | **8 种 Power + 动态 Handler** |
| REST API | 无 | Spring Data REST | **`EruptDataController` 自动暴露** |
| Auto DDL | 无 | Hibernate ddl-auto | **Hibernate ddl-auto** |
| i18n | 无 | 无 | **12 种语言 CSV 词典** |
| Service 钩子 | 拦截器 | `@EntityListeners` | **`DataProxy<T>` 10+ 钩子** |
| 条件查询样板 | 自己包 `if` | Specification | **`(boolean cond, ...)` 重载** |
| **AI 集成** | **无** | **无** | **`erupt-ai-claw` 零代码 LLM CRUD** |
| **流程引擎** | **无** | **无** | **`@EruptFlow` 实体即流程载体** |
| **微服务聚合** | **无** | **无** | **`erupt-cloud-node-jpa` 心跳上报** |
| 适合场景 | C 端高并发 | 标准 CRUD | **后台 / 内部系统 / AI-Native / 多服务中台** |

我们不是说 MyBatis-Plus 或 Spring Data JPA 不好——C 端高并发 + SQL 强控制是 MyBatis-Plus 的主场，标准 CRUD 微服务依然是 Spring Data JPA 最干净。

但当你做的是 **admin 后台、内部系统、运营平台、SaaS 控制台**，且想让这套系统**同时能被运营点、被 LLM 调、跑审批、跨服务聚合**——这是 Erupt 的主场，也是它唯一的主场。

## 十、5 分钟跑通

> 完整依赖配置与项目初始化见 [快速部署](/zh/guide/quick-start)。

1. 实体在 `@Entity` 旁加 [`@Erupt`](/zh/annotation/erupt)，启动 → admin 已经在
2. `application.yml` 设 `hibernate.ddl-auto: update`，表结构自动同步
3. admin 里配一个 LLM（DeepSeek / Ollama 都行），打开 AI Chat
4. 跟它说"查张三上周的订单"——LLM 0 代码完成

不超过 5 分钟。

## 十一、写在最后

回到一开始那个问题——Erupt 是不是 JPA-Plus？

不是。JPA-Plus 这个命名意味着"加一层 SQL DSL"，但 SQL DSL 这一层 MyBatis-Plus 已经做到天花板了，再卷下去边际收益已经很低。

Erupt 在 JPA 上加的是**完整一圈的后台基础设施**——

- **基础四件套**（UI / RBAC / REST API / Auto DDL）让你**写注解就有完整 admin**
- **进阶三件套**（i18n / DataProxy / Lambda）让你**写少量代码扩展业务**
- **杀手三件套**（`erupt-ai-claw` / `@EruptFlow` / `erupt-cloud`）让你**进入这个时代别的框架还没追上的能力**
- **兜底层**（多数据源 + JdbcTemplate）让你**永远有退路**

这 10 件事加在一起，**Erupt JPA 不是 JPA 的下一版本，是 JPA 的超集**。

JPA 这套被吹了 20 年又被骂了 20 年的元数据规范，被我们重新发现成了"低代码的下限"——再压缩就不诚实了。

剩下的事，交给 IDE、Git、Spring 这套已经被验证 20 年的工具链。

:::tip 想立刻动手
跟着上一章 4 个 step 就能跑通。卡住了？去 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 提问，或扫文首二维码加群。
:::
