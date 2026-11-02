---
title: "@EruptScope × EruptScopeService × ChoiceFetchHandler：「当前项目」不该是一条 where"
description: "后台里的「当前项目 / 集群 / 环境」通常是前端的一个下拉框加一堆手写过滤。本期拆 @EruptScope：范围本身是一个 @Erupt 表单类，客户端只递一个值，服务端每次请求都重验、改写查询、强制写入。"
outline: deep
---

# 第 21 期 · 「当前项目」不该是一条 where

> 多项目、多集群、多环境的后台里，「我现在在哪个范围」几乎总是前端的一个全局下拉框，剩下的靠每张表手写一遍过滤。`@EruptScope` 的做法相反：**范围是一个普通的 `@Erupt` 表单类，选项、联动、校验都复用现有注解；客户端只递一个值，服务端每次请求都重新验证它，并改写列表查询、单条读取和新增 / 编辑。**
>
> _发布于 2026-10-19 · 阅读 ~9 min_

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

先看一个场景：运维后台要管三个 Kubernetes 集群，页面顶部有个「当前集群」下拉框，下面是 Pod、Deployment、Service、Event 等九张表。要让所有表跟着下拉框走，常见的写法有三种：每张表的查询接口多带一个 `cluster` 参数；在网关或拦截器里按请求头塞过滤条件；或者干脆每个集群一套页面。

这三种都有同一个问题：**范围是约定，不是声明。** 新增一张表忘了带参数，它就跨集群了；新增 / 编辑接口忘了把 `cluster` 压回去，用户就能把记录写到别的范围里；按 id 读详情时没人检查这条记录属不属于当前范围。

主仓过去两周落地了 `@EruptScope`（`xyz.erupt.annotation.EruptScope`）、运行时 `xyz.erupt.core.scope.EruptScopeService` 和 `EruptScopes`，以及第一个使用者 `erupt-k8s-dashboard`（#414、#416）。它们共同的命题是：

> **范围应当和字段一样被声明，并且由服务端在读、写、按 id 访问三条路径上各执行一次。** 前端的下拉框只是这份声明的一个渲染。

## 二、两种做法：范围是参数，还是范围是模型

| 维度 | 范围是请求参数（手写过滤） | 范围是一个模型（`@EruptScope`） |
|---|---|---|
| 范围的定义 | 散落在各接口的参数和拦截器里 | 一个 `@Erupt` 类，每个带 `edit.title` 的字段是一个条件 |
| 选项从哪来 | 前端另写一份下拉数据 | 复用 `@ChoiceType`、`ChoiceFetchHandler`、`dependField` 联动 |
| 新表怎么加入 | 记得带参数 | 类上加一行 `@EruptScope(XxxScope.class)` |
| 客户端传来的值 | 当作可信输入 | 每次请求重新对照「当前用户能看到的选项」校验 |

## 三、可数的事实：一个注解、两个属性、三条路径

注解只有两个属性：`value()` 指向范围类，`bind()` 默认 `true`，决定是否自动绑定同名字段。范围的值经 `erupt-scope` 请求头传递（URL 编码的 JSON，形如 `{"KubeScope":{"cluster":"orbstack"}}`），不能带头的 TPL 页面用 `_scope` 参数；常量见 `EruptScopeService.HEADER` 与 `PARAM`。

服务端在三条路径上执行它：

- **列表查询**：`EruptService` 把 `eruptScopeService.conditions(eruptModel)` 并入查询条件；
- **按 id 访问**：`EruptService#verifyIdPermissions` 追加同一组条件，范围外的记录按「不存在」处理；
- **新增 / 编辑**：`EruptScopeService#bind` 把当前范围写进提交的 JSON，覆盖客户端发来的值。

## 四、范围就是一个表单类

范围的声明不需要新概念，写一个 `@Erupt` 表单类即可。下面是 `erupt-k8s-dashboard` 里的 `KubeScope`（`xyz.erupt.k8s_dashboard.scope.KubeScope`）：

```java
@Getter
@Setter
// A form, not a table: its first field doubles as the key erupt requires
@Erupt(name = "Workspace", primaryKeyCol = "cluster")
public class KubeScope {

    @EruptField(edit = @Edit(title = "Cluster", type = EditType.CHOICE, notNull = true,
            choiceType = @ChoiceType(fetchHandler = KubeContextFetchHandler.class)))
    private String cluster;

    // Left empty: every namespace
    @EruptField(edit = @Edit(title = "Namespace", type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = KubeScopeNamespaceFetchHandler.class, dependField = "cluster")))
    private String namespace;

}
```

用到它的模型只加一行：`KubePod` 上是 `@EruptScope(KubeScope.class)`。模型里与范围同名的字段（`namespace`）自动绑定；引用类字段（`REFERENCE_TABLE` / `REFERENCE_TREE`）按引用的 id 绑定，范围里存 id，模型里存被引用的行。选项来自 `xyz.erupt.annotation.fun.ChoiceFetchHandler`——和你给任何下拉字段写的是同一个接口。

## 五、服务端怎么「不信任」客户端

`EruptScopeService` 里有几条值得点出的规则，每一条在 `erupt-test/.../scope/EruptScopeTest.java` 里都有对应用例：

- **必填范围从不猜。** `current(Class<?>)` 发现 `notNull` 字段为空就抛 `EruptWebApiRuntimeException`，不会退化成「不过滤」，因为不过滤等于看到所有范围（`noPickIsRefused`）。
- **请求头里的值每次都对照选项。** `accept(...)` 对 CHOICE / MULTI_CHOICE 字段用 `EruptUtil.getChoiceListFilter(...)` 取当前用户可选项逐个比对；越界的值整份丢弃，退回默认值（`headerValuesOutsideTheOptionsAreIgnored`）。
- **只读当前模型声明的那个范围。** 请求头里多塞的其他范围键被忽略（`onlyTheScopeOfTheRequestedModelIsRead`）。
- **写入被压回范围。** 客户端提交 `project=alpha`，当前范围是 `beta`，落库的就是 `beta`（`writesAreForcedIntoTheScope`）；单元格编辑绑定字段直接拒绝，`EruptModifyService` 里有专门一条。
- **范围外的 id 等于不存在。** `idsOutsideTheScopeAreRefused` 覆盖了这条。

下面是核心的条件生成，把范围值变成 `Condition`，多选范围走 `IN`，单值走 `EQ`：

```java
public List<Condition> conditions(EruptModel eruptModel) {
    List<String> fields = boundFields(eruptModel);
    if (fields.isEmpty()) return Collections.emptyList();
    JsonObject values = this.current(scopeOf(eruptModel).value());
    List<Condition> conditions = new ArrayList<>();
    for (String field : fields) {
        JsonElement value = values.get(field);
        if (empty(value)) continue;
        EruptFieldModel fieldModel = eruptModel.getEruptFieldMap().get(field);
        String refId = refId(fieldModel);
        Class<?> type = fieldModel.getField().getType();
        // a reference condition carries the id the way a search does: {id: value}
        Function<JsonElement, Object> convert = it -> null == refId
                ? TypeUtil.typeStrConvertObject(it.getAsString(), type) : Map.of(refId, it.getAsString());
        if (value.isJsonArray()) {
            List<Object> list = new ArrayList<>();
            value.getAsJsonArray().forEach(it -> list.add(convert.apply(it)));
            conditions.add(new Condition(field, list, QueryExpression.IN));
        } else {
            conditions.add(new Condition(field, convert.apply(value), QueryExpression.EQ));
        }
    }
    return conditions;
}
```

:::tip 反直觉的一点
范围条件不是拼在前端、也不是写在每个 `DataProxy#beforeFetch` 里，而是由 `EruptService` 在列表查询和按 id 校验这两处统一并入。你不写 Java 就能让一张新表进入范围；你想绕开某一张表，只能在注解上显式关掉 `bind`，改为自己调用 `EruptScopes.get(...)`——绕开是个动作，而不是遗漏。
:::

### 非 SQL 数据源也能直接读范围

不是所有数据都在 SQL 表里。`erupt-k8s-dashboard` 的模型走 `@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)`，数据来自 Kubernetes API，没有 `where` 可言。这时数据源可以自己读范围（需要时把 `bind` 设为 `false`，避免框架再按字段名绑定一次）：

```java
@Component
public class KubeScopeContextResolver implements K8sContextResolver {

    @Override
    public String context(EruptK8s eruptK8s) {
        if (!KubeCluster.MASTER_URL.equals(eruptK8s.masterUrl())) return null;
        return KubeContextFetchHandler.context(EruptScopes.get(KubeScope.class).getCluster());
    }

}
```

`EruptScopes.get(...)` 返回的是**已验证过**的范围对象：来自请求头的值，或表单的 `addBehavior` 默认值。同一个声明因此既能约束 JPA 表，也能决定一个 Pod 列表该连哪个集群。

## 六、跟宜搭 / 简道云 / 明道云怎么比？

我们没有逐项实测这些平台。下表左列是**选型时值得问的问题**，不是对它们的结论；各平台能力以官方文档和实测为准。

| 维度 | 国内对位平台：选型时该问 | Erupt |
|---|---|---|
| 全局上下文（项目 / 环境） | 宜搭、简道云、明道云里的「当前项目」是页面变量、筛选组件，还是平台级概念？新增一张表要不要逐页接线？ | 类上一行 `@EruptScope`，同名字段自动绑定 |
| 客户端值的可信度 | 从 URL 或筛选组件传来的值，服务端是否按当前用户的可选项再校验？ | 每次请求重验（`EruptScopeService#accept`），越界值丢弃 |
| 写入路径 | 新增 / 编辑能否被绑定到当前范围，而不是依赖前端预填？ | `bind(...)` 覆盖客户端提交的值；单元格编辑绑定字段被拒 |
| 非数据库数据 | 范围能否作用于接口 / API 型数据源？ | `EruptScopes.get(...)` 供任意数据处理器读取 |
| 与权限的关系 | 范围和数据权限是不是同一个东西？ | 不是，见下文 |

### 代价与边界

- **范围不是权限。** 注解的 Javadoc 写得很直白：范围只收窄菜单本来就能看到的数据；要让用户彼此隔离（看不到某个项目），要用按用户过滤选项的 `ChoiceFetchHandler`，或者 `@Filter` / 数据权限。
- **自由文本字段「按输入处理」。** 没有选项可比对的字段（例如测试里的 `tag`）直接采信输入。
- **必须有菜单。** `EruptScopeController` 只列出用户菜单里可见的模型所声明的范围；`authVerify = false` 的模型除外。
- **选项处理器自己负责缓存。** `EruptScopeService` 注释里说明不做范围级缓存，每次请求都会重新问选项；贵的处理器要自己缓存（#420）。

## 七、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

跑通之后，写一个范围表单类（如上面的 `KubeScope`），在任一 `@Erupt` 模型上加 `@EruptScope(KubeScope.class)`，并确保模型里有与范围字段同名的字段，页面顶部就会出现范围选择器。想看完整例子，直接启用 `erupt-k8s-dashboard`。

## 八、下一期预告

`erupt-webhook` 已经顺延了两期：它订阅 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，在事务提交之后用 HMAC-SHA256 签名把数据变更投递给外部系统。下一期我们聊的是：**为什么「数据变了通知外部」不该写在 `DataProxy#afterAdd` 里**，以及投递失败的重试为什么发生在请求线程之外。

---

:::info 参与讨论
本期涉及的源码：`erupt-annotation/.../EruptScope.java`、`erupt-core/.../scope/EruptScopeService.java`、`erupt-core/.../scope/EruptScopes.java`、`erupt-upms/.../controller/EruptScopeController.java`、`erupt-plugin/erupt-k8s-dashboard/.../scope/KubeScope.java`，以及 `erupt-test/.../scope/EruptScopeTest.java`。

范围能不能再叠一层「按用户」的默认值或白名单，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
