---
title: "模型图谱与静态审计"
description: 低代码平台画模型关系图，通常是为了"看起来专业"。erupt-atlas 押反向——图只是副产品，真正的输出是对运行时注册表的一次静态审计：循环依赖、共享物理表、孤儿模型、建了没挂菜单的模型、声明了权限却没长出按钮。
outline: deep
---

# 第 09 期 · 模型图谱与静态审计

> 低代码平台用起来越顺手，模型就攒得越快。三个月后没人说得清系统里到底有多少张表、谁引用了谁、哪些模型建完就再没人打开过。
> 这一期讲 `erupt-atlas`：它画的那张模型关系图其实是副产品，**真正的输出是一份审计报告**——而它之所以能零配置生成，只因为 Erupt 从头到尾只有一份真相：运行时的 `@Erupt` 注册表。
>
> _发布于 2026-09-15 · 阅读 ~10 min_

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

低代码的卖点是"建一个模型只要五分钟"。这句话是真的，代价也是真的：**建模成本降到五分钟之后，没有人会在建之前先想清楚。**

我们见过的真实状态是这样的：一个跑了两年的后台，`@Erupt` 类三百多个。问团队几个问题——

- 哪些模型跟别的模型有引用关系，哪些完全孤立？
- 有没有两个模型偷偷挂在同一张物理表上？
- 有多少模型建完了、连菜单都没挂，永远没人能打开？
- 有没有 A 引用 B、B 引用 C、C 又引用回 A 的环？

没人答得上来。不是团队不专业，是**这些事实不在任何一个地方存着**。

再看国内同类的处理方式：

- **JeecgBoot / 若依 RuoYi** 走代码生成路线。生成那一刻，模型定义从工具里流进 `src/main/java`，此后工具再也不知道你把它改成了什么样。要看全局，只能翻 ER 图或者 `SHOW TABLES` ——而那是**数据库**的视图，不是**业务模型**的视图，看不见谁在表单里引用了谁。
- **简道云 / 明道云** 有全局视图，但表单定义在 SaaS 的黑盒里。关联关系是产品给你渲染的一张图，不是你能读、能查、能写进 CI 的数据。

本文的反向命题是：

> **模型关系图不该是一张给人"看关系"的装饰图。它应该是一次审计的输出——图只是把审计结果画出来了而已。**
>
> **而一个低代码框架能不能做到这件事，取决于一个很朴素的问题：它的模型定义，运行时到底有没有唯一真相源。**

## 二、两种"看见自己"的方式

| 维度 | 文档式 / 生成式（JeecgBoot、若依） | 注册表式（Erupt） |
| --- | --- | --- |
| 真相在哪 | 生成的源码 + 手工维护的 ER 图 | 运行时 `EruptCoreService` 注册表 |
| 谁来更新 | 人。改了模型要记得改图 | 没有"更新"这个动作，每次请求现场重建 |
| 运行时新增的模型 | 看不见（设计器发布的模型不在 ER 图里） | 自动出现，无需重启 |
| 关系从哪来 | 数据库外键 / 手绘 | `@EruptField` 的 `edit().type()` |
| 能否被审计 | 只能靠人眼扫 | 图的构建过程本身就是审计过程 |

差别不在"谁画得好看"，在**这张图有没有可能过期**。手工维护的图一定会过期；从注册表现场重建的图，不存在过期这个状态——它要么正确，要么服务没起来。

`EruptCoreService` 里守着这份真相的，是两个静态字段：

```java
public class EruptCoreService {

    private static final Map<String, EruptModel> ERUPTS = new LinkedCaseInsensitiveMap<>();

    // Models registered after startup: erupt-designer publishes into here
    private static final Set<String> RUNTIME_ERUPTS = new HashSet<>();

    public static List<EruptModel> getErupts() { /* ... */ }

    public static boolean isRuntimeErupt(String eruptName) {
        return RUNTIME_ERUPTS.contains(eruptName.toLowerCase());
    }
}
```

`RUNTIME_ERUPTS` 这一行是关键。[第 07 期](/zh/topics/bytecode-designer)讲过 erupt-designer 把设计稿用 ByteBuddy 编译成真 `@Erupt` 类——它们注册进的就是同一个 `ERUPTS`。所以**设计器发布的模型、erupt-flow 的表单模型，在图谱里和手写实体是同一等公民**，不需要图谱侧写任何适配代码。

## 三、一次 `build()` 扫出多少事实

`erupt-atlas` 的整个对外契约是一个 record，30 行读完：

```java
public record AtlasView(List<Node> nodes, List<Edge> edges, Audit audit, Map<String, String> text) {

    /** kind: "erupt" (@Erupt model), "cube" (@EruptCube), "remote" (served by an erupt-cloud node) */
    public record Node(String id, String name, String label, String source, String kind,
                       boolean runtime, int fields, int dimensions, int measures, String table) {
    }

    /** kind: reference | tab | embed | drill | operation | cubeOf | join | table */
    public record Edge(String from, String to, String label, String kind) {
    }

    public record Audit(List<List<String>> cycles, List<SharedTable> sharedTables,
                        List<String> orphans, List<String> unpublished) {
    }

    public record SharedTable(String table, List<String> models) {
    }
}
```

可数的部分：

- **3 类节点**：`@Erupt` 模型、`@EruptCube` 分析模型、erupt-cloud 远端节点提供的模型。
- **8 类边**：`reference` / `tab` / `embed` / `drill` / `operation` / `cubeOf` / `join` / `table`。前三类是真实的数据耦合，后五类是导航与聚合。
- **4 项审计**：环、共享表、孤儿、未发布。
- **另开一个端点的第 5 项**：权限漂移（`/power`，见 §五）。

另外两个字段值得单独说。`Node.source` 把类的包名收敛成模块名——`xyz.erupt.upms.model.EruptUser` 归到 `upms`，业务包 `com.acme.crm.Customer` 原样保留。于是图天然按模块分组，不用任何配置：

```java
private static String source(Class<?> clazz) {
    if (null == clazz || null == clazz.getPackage()) return null;
    String pack = clazz.getPackage().getName();
    if (!pack.startsWith(PACKAGE_PREFIX)) return pack;
    String tail = pack.substring(PACKAGE_PREFIX.length());
    int dot = tail.indexOf('.');
    return dot > 0 ? tail.substring(0, dot) : tail;
}
```

`Node.runtime` 则直接来自 `EruptCoreService.isRuntimeErupt(...)`——图上能一眼分出"编译期写死的"和"设计器运行时发布的"。

## 四、关系是从注解推出来的，不是从外键

这是和 ER 图工具最本质的分歧。数据库外键描述的是**存储约束**；业务上的"引用"远比外键宽——一个 `TAB_TABLE_REFER` 字段是引用，一个 `COMBINE` 嵌入也是引用，但它们在库里可能连外键都没有。

`erupt-atlas` 的做法是直接读 `@EruptField` 的编辑类型：

```java
private static String fieldKind(EruptFieldModel fieldModel) {
    return switch (fieldModel.getEruptField().edit().type()) {
        case TAB_TREE, TAB_TABLE_ADD, TAB_TABLE_REFER, CHECKBOX -> "tab";
        case COMBINE, MULTI_FORM -> "embed";
        default -> "reference";
    };
}
```

三行 switch，覆盖了 Erupt 全部的模型间字段类型。再叠上 `@Drill`、`@RowOperation`、`@EruptCube` 的 `@Join`，八类边就齐了。

:::tip 一个反直觉的小结
判断"环"的时候，`erupt-atlas` **只认三类边**：

```java
private static final Set<String> STRUCTURAL = Set.of("reference", "tab", "embed");
```

`drill` 和 `operation` 被排除在外。理由写在源码注释里：*a drill or a row operation pointing back is navigation, not coupling* ——钻取回父模型是产品设计，不是架构债。

大多数依赖分析工具在这里会误报，因为它们只看"有没有连线"，不看**这条线是数据还是导航**。而 Erupt 分得清，是因为线的类型是从注解语义来的，不是从连线动作来的。
:::

环的检测用的是 Tarjan 强连通分量，结果按环的大小降序排，最大的环排最前——先修最疼的那个。

## 五、图不说出口的那五件事

这一节才是本文的 thesis。`Audit` 里的四项加上 `/power` 端点的第五项，没有一项是"关系图"这个概念天然包含的。

**1. 环（cycles）** — Tarjan 跑出的强连通分量。A 引用 B、B 引用 C、C 引用回 A，三个模型任何一个都不能独立删除或独立迁移。

**2. 共享物理表（sharedTables）** — 两个及以上 `@Erupt` 类 `@Table` 到同一张表。这通常是有意的（读写分离视图、不同权限的窗口），但它意味着**在 A 上加的校验，从 B 进来的写入绕过了**。

**3. 孤儿（orphans）** — 没有任何关系边碰到的模型：

```java
// Models no relation touches: usually logs and registries, sometimes something forgotten
private static List<String> orphans(List<AtlasView.Node> nodes, Collection<AtlasView.Edge> edges) {
    Set<String> touched = new HashSet<>();
    for (AtlasView.Edge edge : edges) {
        touched.add(edge.from());
        touched.add(edge.to());
    }
    List<String> list = new ArrayList<>();
    for (AtlasView.Node node : nodes) {
        if ("erupt".equals(node.kind()) && !touched.contains(node.id())) list.add(node.name());
    }
    return list;
}
```

**4. 未发布（unpublished）** — 有实体表、但菜单树里没有任何菜单指向它的模型。这一项最能暴露"五分钟建一个模型"的后遗症：

```java
/**
 * Entity-backed models with no menu bound to them. A sub-table or a popup form legitimately
 * has no menu, so this is a candidate list to read, not a defect list to clear.
 */
private List<String> unpublished(List<AtlasView.Node> nodes) {
    EruptDao eruptDao = eruptDaoProvider.getIfAvailable();
    if (null == eruptDao) return new ArrayList<>();
    Set<String> bound = new LinkedHashSet<>();
    for (EruptMenu menu : eruptDao.lambdaQuery(EruptMenu.class).list()) {
        if (null != menu.getValue()) bound.add(menu.getValue().toLowerCase());
    }
    List<String> list = new ArrayList<>();
    for (AtlasView.Node node : nodes) {
        if (!"erupt".equals(node.kind()) || null == node.table()) continue;
        if (!bound.contains(node.name().toLowerCase())) list.add(node.name());
    }
    return list;
}
```

注意 `eruptDaoProvider.getIfAvailable()`：不带 `erupt-data-jpa` 跑的应用没有菜单表，这一项静默跳过而不是抛异常。也注意那段 Javadoc——**这是一份候选清单，不是缺陷清单**。子表和弹窗表单本来就不该有菜单。工具给事实，判断留给人。

**5. 权限漂移（`/power`）** — 单独一个端点，因为它是所有项里最隐蔽的：

```java
/**
 * What a model declares it can do, next to what the menu tree actually offers. The two drift:
 * function buttons are written once, when the menu is created, from the power flags as they stood
 * then — a flag flipped afterwards never grows a button, and the permission behind it is never
 * granted to anyone.
 */
public record PowerRow(String model, String label, String module, String menuType,
                       List<String> power, List<String> buttons, String powerHandler) {
}
```

翻译成大白话：**你在 `@Power` 里把 `export = true` 打开了，但菜单是半年前建的，那时它还是 `false`。功能按钮只在建菜单那一刻写一次，之后不会自己长出来。** 于是权限声明和权限实际可授予范围就悄悄分叉了——代码 review 看不出来，测试也不会报，只有用户说"我这儿怎么没有导出按钮"的时候才会浮出水面。

`PowerRow` 把两边并排列出来（`power` 是注解声明的，`buttons` 是菜单树实际携带的），差异一眼可见。顺带还列出 `powerHandler`：如果不是默认的 `PowerHandler`，说明这个模型的权限是被自定义逻辑接管的（见 [@Power](/zh/annotation/power)）。

## 六、跟 JeecgBoot / 若依 / 简道云 怎么比

| 维度 | JeecgBoot / 若依 RuoYi | 简道云 / 明道云 | Erupt (erupt-atlas) |
| --- | --- | --- | --- |
| 全局模型视图 | 无内置，需外部 ER 工具 | 有，产品内渲染 | 有，`/erupt-api/atlas/view` 返回 JSON |
| 视图会不会过期 | 会（生成后源码自行演化） | 不会 | 不会（每次请求重建） |
| 关系来源 | 数据库外键 | 平台内部表单关联 | `@EruptField` 编辑类型语义 |
| 区分数据耦合 / 导航 | 否 | 否 | 是（`STRUCTURAL` 三类才算耦合） |
| 循环依赖检测 | 无 | 无 | Tarjan SCC，按环长降序 |
| 共享物理表检测 | 无 | 不适用（表不由你定义） | 有 |
| "建了没挂菜单"检测 | 无 | 不适用 | 有 |
| 权限声明 vs 实际按钮 | 无 | 无 | 有（`/power`） |
| 运行时新增模型是否入图 | 否 | 不适用 | 是（设计器 / flow 发布即现） |
| 数据能否流出做 CI 门禁 | 需自己写解析 | 否（SaaS 黑盒） | 是，三个 REST 端点返回结构化 JSON |

最后一行是我们最在意的。`AtlasView` 是 record，序列化出去就是一份干净 JSON——**你可以在 CI 里拉一次 `/atlas/view`，断言 `audit.cycles` 为空、`audit.sharedTables` 不超过白名单**。图能被人看，也能被机器断言，这才是把它做成审计而不是插画的意义。

:::info 权限边界
三个端点都挂着 `@EruptMenuAuth(AtlasConstant.MENU_ATLAS)` ——图谱本身就是一份系统结构情报，默认只有被授予「模型图谱」菜单的角色能读。这与[第 06 期](/zh/topics/security-defaults)讲的"安全是注解默认值"是同一条思路。
:::

## 七、5 分钟上手

从空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，加一个依赖就有图谱（最低版本 **2.2.0**）：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-atlas</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

没有任何配置项，不落库。引入后菜单里出现 **模型图谱** 根菜单，下含 **模型关系图** 与 **Erupt 类注册表** 两个入口。完整界面说明见 [Erupt Atlas 模型图谱](/zh/modules/erupt-atlas)。

第一次打开时，建议直接跳过总览图去看审计面板——**在一个跑了一年以上的项目上，那四项里大概率有东西**。

## 八、下一期预告

这一期讲的是"平台知道自己长什么样"。下一期我们往回退一步，讲**平台知道自己在被怎么用**：

> **第 10 期 · `@Power` × 菜单树 × 操作日志：权限不是配出来的，是被用出来的**

`PowerRow` 暴露的那条"声明与实际的漂移"只是开头。当把 `@Power` 的静态声明、菜单树的实际授予、以及 `EruptOperateLog`（它同时挂着 `@Erupt` 和 `@EruptCube`，本身就是个分析模型）的真实调用记录三者叠在一起看，会发现绝大多数后台系统的权限模型都过度设计了——**授出去的权限里有一大半，从来没有人用过。**

---

:::info 参与讨论
本期专题对应的核心源码在 [`erupt-plugin/erupt-atlas`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-atlas)，注册表在 [`xyz.erupt.core.service.EruptCoreService`](https://github.com/erupts/erupt/blob/master/erupt-core/src/main/java/xyz/erupt/core/service/EruptCoreService.java)。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，说说你在自己项目上跑出来的那四项审计里有什么。
:::
