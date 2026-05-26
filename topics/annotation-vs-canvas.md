---
title: "@Erupt × DataProxy × Handler：为什么我们没去做拖拽画布"
description: 当钉钉宜搭、简道云、JeecgBoot 全部押注"画布"或"画布生成代码"的时候，Erupt 仍然押注源代码本身——一行 @Erupt 注解、一个 DataProxy<T> 扩展点、一组 Handler 接口。这一期讲清楚为什么。
outline: deep
---

# 第 02 期 · @Erupt × DataProxy × Handler

> Erupt 的最小单位不是一个画布，而是一段 Java 代码——`@Entity` 旁边再贴一个 `@Erupt`，就完成了"声明一个 admin 界面"这件事。这一期把"为什么我们没去做拖拽画布"的工程理由讲透。
>
> _发布于 2026-05-22 · 阅读 ~9 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

最近一年国内低代码圈的产品发布会几乎是同一份提案：

- **钉钉宜搭 / 阿里云 AppCube**：表单 + 流程 + 报表，全靠拖拽。
- **腾讯微搭**：浏览器画布 + AI 副驾驶，"自然语言改组件"。
- **简道云 / 明道云**：SaaS 拖拽，主打"业务人员自己搭"。
- **JeecgBoot / JNPF**：在线设计器画好表单，**生成一份 Java + Vue 代码**给你接着改。

它们的范式可以拆成两派：

- **画布即应用**（宜搭 / 微搭 / 简道云 / 明道云）：画布是真理来源，导出仅作为备份。
- **画布生成代码**（JeecgBoot / JNPF）：画布是初始脚手架，生成完代码之后你回到 IDE 改。

Erupt 在同一时期做的事是第三条路：

> **代码本身就是配置。**没有画布、没有"生成"，注解就是 UI Schema 的物化形态。

这听起来反直觉：现在 AI 都在帮人写代码了，为什么还要让用户写注解？这一期专题把这条反向押注的工程理由写清楚。

## 二、三种"低代码"的根本分歧

国内市场上"低代码"三个字底下其实塞了三种完全不同的系统：

| 维度 | **画布即应用**<br/>宜搭 / 微搭 / 简道云 | **画布生成代码**<br/>JeecgBoot / JNPF | **代码即配置**<br/>**Erupt** |
| --- | --- | --- | --- |
| 配置真理在哪 | SaaS 画布的内部 DB | 一次性生成的 `.java` / `.vue` 文件 | Git 中的 `.java` 源文件 |
| 加一个字段 | 进画布配 → 同步表结构 | 改实体 + 改 Vue + 改 mapper | `@EruptField` 加一行 |
| Diff / Review | 截图对比 | `git diff`，但要 diff 自动生成的代码 | `git diff`，且只 diff 注解 |
| 跨环境部署 | 应用包导入导出 | jar + 同步 SQL | `mvn package` → jar |
| 业务逻辑写在哪 | 表单后端事件 + JS 片段 | 改 service / controller | Spring Bean + `DataProxy<T>` |
| 二次修改成本 | 低（拖拽） → 高（业务复杂时） | 高（画布与生成代码漂移） | 恒定（一直在 IDE 里） |
| 协作主体 | 业务、运营 | "懂代码的业务人员" | Spring Boot 后端工程师 |

三条路不存在谁更高级的问题，**它们假设的用户和系统寿命完全不同**：

- 画布即应用假设"轻量场景，活两年"。
- 画布生成代码假设"PoC 快，长期当代码维护"——但很少人注意到，**一旦回到 IDE 修代码，画布就不再可信**，下一次想用画布添字段就要承担同步成本。
- Erupt 假设：**这个国家有十万家公司的后台系统，已经过了"快速 PoC"那一刻**，他们要的是把一份稳定的领域模型，最小代价地暴露成 admin 界面。

## 三、`@Erupt`：领域模型的最小注解面

看一个典型的 Erupt 实体：

```java
@Erupt(
    name = "客户",
    power = @Power(importable = true, export = true)
)
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
        views = @View(title = "客户名"),
        edit = @Edit(title = "客户名", notNull = true, search = @Search)
    )
    private String name;

    @EruptField(
        views = @View(title = "等级"),
        edit = @Edit(
            title = "等级",
            type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "A", label = "A 类"),
                @VL(value = "B", label = "B 类")
            })
        )
    )
    private String level;
}
```

只用了 **3 个注解** 和 **2 个字段**，Erupt 就生成了：

- 列表页（含搜索框、Excel 导入导出按钮、按等级过滤）
- 新建 / 编辑表单（含必填校验、下拉选项）
- 权限 / 菜单 / API endpoint
- 前端表格行为（排序、列宽、操作列）

注解面如此小的原因在 `erupt-core/proxy/AnnotationProxyPool.java`——Erupt 在启动时把 `@Erupt`、`@EruptField`、`@View`、`@Edit` 这些注解通过 `AnnotationProxy<T,R>` 序列化成 JSON，前端 Angular 拿到 JSON 就动态渲染界面。

也就是说**注解不是装饰，是真的 UI Schema**——只不过 schema 写在代码里、用 IDE 自动补全、被 Git 版本管理。

:::tip 这件事和 Decorator 模式的差别
React 的装饰器、Spring 的 `@Component` 都是"运行时行为标记"——注解只影响行为。
`@Erupt` 是"配置面物化"——注解就是 UI 配置本身，可以被序列化为 JSON 给前端，也可以被 AI 读取理解。
:::

## 四、`DataProxy<T>`：让 Spring Bean 直接参与生命周期

画布派会被问的第一个问题永远是："那如果业务逻辑很复杂怎么办？"

宜搭 / 微搭这类纯画布派的答案是"事件 + 简单脚本"——你在画布的属性面板里写 `function onSubmit(formData) { ... }`，没有完整 IDE、没有 Spring 容器、没有事务。JeecgBoot 这类生成派的答案是"画布画完之后回 IDE 改 service 层"——但下一次再用画布加字段，就得手动合并冲突。

Erupt 走的是第三条路——它在 `erupt-annotation` 模块定义了一个接口：

```java
public interface DataProxy<MODEL> extends MetaProxy<MODEL> {
    default void validate(MODEL model) throws EruptException {}
    default void beforeAdd(MODEL model) {}
    default void afterAdd(MODEL model) {}
    default void beforeUpdate(MODEL model) {}
    default void afterUpdate(MODEL model) {}
    default void beforeDelete(MODEL model) {}
    default void afterDelete(MODEL model) {}
    default String beforeFetch(List<Condition> conditions) { return null; }
    default void afterFetch(Collection<Map<String, Object>> list) {}
    default void searchCondition(Map<String, Object> condition) {}
    // ...
}
```

源码：`erupt-annotation/src/main/java/xyz/erupt/annotation/fun/DataProxy.java`

任意实现这个接口的 Spring Bean，被 `@Erupt(dataProxy = ...)` 引用之后，就在 admin 的增删改查生命周期里跑业务逻辑——而且：

- 它是普通 `@Service`，能 `@Autowired` 任何东西
- 它是 Spring 管理的，可以打 `@Transactional`、`@PreAuthorize`
- 它是 Java，能直接调用 JPA、Redis、消息队列、外部 HTTP
- 它是源码，能 code review、能写单测、能用 IDE 重构

```java
@Service
public class CustomerProxy implements DataProxy<Customer> {

    @Resource private CustomerService service;
    @Resource private AuditLogger auditLogger;

    @Override
    @Transactional
    public void beforeAdd(Customer model) {
        service.assertNameUnique(model.getName());
        model.setOwnerId(MetaContext.getUser().getId());
    }

    @Override
    public void afterUpdate(Customer model) {
        auditLogger.log("customer.update", model.getId());
    }
}
```

这一段代码，和画布派那种"在属性面板里写 JS"的本质区别是：**它跟你 service 层共享同一个事务管理器、同一个安全上下文、同一份单元测试**。

## 五、Handler 接口：所有"动态行为"都收敛到 Java 类

画布派第二个常被吹的点是"无代码动态行为"——某个下拉框的选项动态拉取、某个按钮按一下触发自定义流程、某行只对管理员可见。

这些功能在画布里通常通过"事件配置面板 + 自创 DSL"实现。

Erupt 给同一组问题的答案是 **Handler 接口**——所有需要"运行时给一个答案"的地方，都对应一个 Java 接口，让你实现一个 `@Service` Bean，然后在注解里引用类即可：

| 场景 | 注解 | Handler 接口 |
| --- | --- | --- |
| 数据过滤（行级权限 / 自定义查询） | `@Filter(conditionHandler = ...)` | `FilterHandler` |
| 自定义操作按钮 | `@RowOperation(operationHandler = ...)` | `OperationHandler<Row, Form>` |
| 动态权限控制 | `@Erupt(powerHandler = ...)` | `PowerHandler` |
| 下拉选项动态拉取 | `@ChoiceType(fetchHandler = ...)` | `ChoiceFetchHandler` |
| 输入框自动补全 | `@InputType(autoCompleteHandler = ...)` | `AutoCompleteHandler` |
| Tag 选项动态拉取 | `@TagsType(fetchHandler = ...)` | `TagsFetchHandler` |

源码位置：`erupt-annotation/src/main/java/xyz/erupt/annotation/fun/`

举一个典型例子——只让用户看到自己创建的订单：

```java
@Service
public class MyOrderFilter implements FilterHandler {
    @Override
    public String filter(String condition, String[] params) {
        Long uid = MetaContext.getUser().getId();
        return "ownerId = " + uid;
    }
}

@Erupt(
    name = "订单",
    filter = @Filter(conditionHandler = MyOrderFilter.class)
)
@Entity
public class Order extends BaseModel { /* ... */ }
```

注意这个 Handler 的设计选择：**它不是字符串表达式，而是一个真的 Java 接口**。这意味着：

- 你能 `@Autowired` 引入 `RoleService`、`TenantContext` 等任何 Spring Bean
- 你能写单元测试，让 PR 不靠 QA 也能合并
- 你能用 IDE 跳转、重构、追引用
- 复杂逻辑（多租户切换、季度切片、A/B 实验）就是普通 Java，没有任何"低代码 DSL"需要学

对比国内大部分低代码平台用的"条件构造器 UI + 自创 DSL"——一旦逻辑稍微复杂就跑去画布里翻嵌套下拉，写完无法 code review，**Erupt 的赌注是：宁可让你写 6 行 Java，也不要让你学一套只能用一次的 DSL**。

## 六、跟 国内主流低代码平台 怎么比？

| 维度 | **钉钉宜搭 / 腾讯微搭** | **简道云 / 明道云** | **JeecgBoot / JNPF** | **Erupt** |
| --- | --- | --- | --- | --- |
| 范式 | SaaS 拖拽画布 | SaaS 拖拽画布 | 在线设计器**生成**代码 | **代码即配置** |
| 真理来源 | 画布内部数据 | 画布内部数据 | 生成出的 Java + Vue | **Git 源码** |
| 私有化 | 部分需企业版 | 部分需企业版 | 自部署 | **自部署，单 jar 启动** |
| 业务扩展 | 事件 + JS 片段 | 表单事件 + 自动化 | 改生成出的 service / mapper | **Spring Bean + `DataProxy<T>`** |
| 动态行为扩展点 | 画布事件配置 | 内置触发器 | 改生成代码 | **Handler 接口（6+ 个）** |
| 权限模型 | 平台内置 | 平台内置 | 内置 RBAC | **`@Power` + `PowerHandler`，可注入业务规则** |
| Diff / Code Review | 截图 / 版本快照 | 同上 | `git diff` 生成的代码 | **`git diff` 注解本身** |
| 跨环境部署 | 应用导出 / 导入 | 同上 | jar + 同步 SQL | **`mvn package` 一个 jar** |
| AI 集成姿态 | 主推"自然语言改组件" | 表单 AI 字段 | 暂无统一方案 | **`erupt-ai` 把 LLM 当 Bean** |
| 适合谁 | 业务、运营、轻 IT | 业务、SaaS 部门 | 想快速搭原型的 Java 团队 | **Spring Boot 团队 / 强领域模型 / 强合规** |

我们不是在说画布派一定是错的——对没工程团队的业务部门来说，"在浏览器里搭出一个查库 App"就是真实生产力。

JeecgBoot 这类生成派也有它的位置——**当你只关心"快速跑起来"，且永远不会再用画布回炉**，生成派是合理的脚手架。

但当系统已经长大、领域模型已经稳定、合规和审计是硬约束时，画布即应用会撞上"逻辑表达力上限"，画布生成代码会撞上"双向同步漂移"。**这两个问题在第一性原理上都不可解**——因为它们都在尝试"既要画布的轻，又要代码的强"。

Erupt 的反向押注是：**承认代码本身就是低代码的下限**。注解已经是配置面，再压缩就不诚实了。剩下的事情交给 IDE、Git、Spring 这套已经被验证 20 年的工具链。

## 七、5 分钟从注解到界面

从一个空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、`application.yml`、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，回头看本文 §四（DataProxy）与 §五（Handler）就能立刻挂上业务扩展——加业务逻辑写 `DataProxy<Demo>`、加动态过滤写 `FilterHandler`、加自定义按钮写 `OperationHandler`。每一步都是写 Java，每一步都被 IDE、被 Git、被 CI 接管，没有任何一行回到画布。

---

:::info 参与讨论
本期专题对应的核心源码在 [`erupt-annotation`](https://github.com/erupts/erupt/tree/master/erupt-annotation) 与 [`erupt-core/proxy`](https://github.com/erupts/erupt/tree/master/erupt-core/src/main/java/xyz/erupt/core/proxy)。
如果你的团队踩过"画布派 → 注解派"或反向迁移的真实路径，欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，下次专题选题会优先考虑社区案例。
:::
