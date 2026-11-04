---
title: "ByteBuddy × JsonAnnotationProxy × @EruptDataProcessor：我们做了设计器，但它编译成一个真 @Erupt 类"
description: 在线表单设计器几乎都把设计稿存成一份 JSON DSL，运行时靠解释器渲染。erupt-designer 押反向：设计稿在运行时被 ByteBuddy 编译成一个真正的 @Erupt 类，复用与手写实体完全相同的管线，无重启、无生成代码、无解释器。
outline: deep
---

# 第 07 期 · 字节码设计器

> 第 02 期我们解释过"为什么没去做拖拽画布"。这一期要承认一件事：我们做了设计器——但它不解释 JSON。设计稿在运行时被 ByteBuddy 编译成一个真正的 `@Erupt` 类，然后走和手写实体**完全相同**的那条管线：Gson 序列化、反射、校验、`DataProxy`、甚至 `@EruptFlow` 审批流。没有解释器，没有生成的源码文件，没有重启。
>
> _发布于 2026-06-17 · 阅读 ~10 min_

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

在线表单设计器是国内低代码的标配能力。宜搭、简道云、明道云、JNPF、JeecgBoot 的在线设计器，背后几乎是同一套机制：

> 你在画布上拖出来的东西，被序列化成一份 **JSON DSL**，存进平台数据库；运行时由一个**解释器**读这份 JSON，动态渲染页面、拼 SQL、执行校验。

这套机制能跑，但它有一条结构性的裂缝：**设计稿的"语言"和应用的"语言"是两套**。设计稿是 JSON，应用是被解释的 JSON——它永远不可能用上宿主框架里那些"只认识真类、真注解、真字段"的能力（ORM 的实体映射、Bean Validation、面向类型的扩展点）。想接这些能力，要么解释器自己重造一遍，要么干脆放弃。

第 02 期我们押注"代码即配置"，论证过为什么不做画布。但有一类真实需求绕不过去：**运营要在不发版的情况下，自己加一张表、配几个字段**。这一期讲我们怎么在不背叛"代码即配置"的前提下，把这件事做出来——

> **设计器的产物不应该是被解释的 JSON，而应该是一个真正的字节码类。**

## 二、三种"在线设计器"的根本分歧

| 维度 | **解释型设计器**<br/>宜搭 / 简道云 / 明道云 | **生成型设计器**<br/>JNPF / JeecgBoot | **字节码设计器**<br/>**erupt-designer** |
| --- | --- | --- | --- |
| 设计稿存成什么 | JSON DSL | JSON → 模板生成 `.java`/`.vue` | JSON 草稿（仅作草稿） |
| 运行时拿到的是什么 | 被解释的 JSON | 落盘的源码文件 | **运行时编译出的真 Class** |
| 要不要重新编译/发版 | 否 | **是**（生成完要编译重启） | **否**（ByteBuddy 运行时加载） |
| 能复用 ORM / 校验 / 反射吗 | 解释器自造 | 能（已经是真类） | **能（本来就是真类）** |
| 能挂宿主框架的扩展点吗 | 受限于解释器 | 能，但要改生成出的代码 | **直接挂 `DataProxy` / `@EruptFlow`** |
| 设计稿与运行物的关系 | 同一份 JSON | 漂移（改了代码画布就失真） | **草稿→类，单向编译** |

解释型的代价是"语言隔离"：JSON 用不上类世界的能力。生成型的代价是第 02 期讲过的"双向漂移"：画布生成代码后，一旦回 IDE 改，画布就不再可信。

erupt-designer 选的是第三条：**草稿是 JSON，但运行物是字节码类**。草稿只负责"长什么样"，一旦发布，就被编译成一个和手写 `@Erupt` 实体无法区分的类——之后所有能力都不是设计器重造的，而是框架本来就有的。

## 三、一次"发布"经过的真实路径

erupt-designer 是一个独立模块（`erupt-designer`，2026-06 落到根模块），对外只有 5 个端点，全部挂在 `@EruptMenuAuth("DesignerEntity")` 权限位下（源码 `controller/EruptDesignerController.java`）：

| 端点 | 作用 |
| --- | --- |
| `POST /designer/preview` | 把当前草稿即时转成 `EruptBuildModel` 预览，不落库 |
| `POST /designer/publish/{className}` | 发布：编译成类 + 注册进运行时 |
| `GET /designer/config/{className}` | 取回某个设计的配置 |
| `GET /designer/java-code` | 把草稿反向导出成等价的手写 `@Erupt` Java 源码 |
| `GET /designer/erupts` | 列出已注册模型（名称 + label 键值对） |

关键数字是 **0**：发布一个新模型，**0 次重启、0 个落盘的源码文件、0 个解释器**。`java-code` 端点的存在尤其能说明设计哲学——设计器随时能把自己"打回原形"成一段你可以粘进 IDE 编译的 `@Erupt` 源码。设计器不是另一套世界，它只是同一段代码的可视化入口。

## 四、关键能力一：ByteBuddy 把草稿编译成真字段类

发布时，`DesignerClassFactory.build(form)` 用 ByteBuddy 现场造一个 `BaseModel` 的子类，把草稿里的字段定义成**真正的 Java 字段**，并打上 `@EruptDataProcessor` 路由注解：

```java
public static Class<?> build(DesignerForm form) {
    DynamicType.Builder<?> builder = new ByteBuddy()
            .subclass(BaseModel.class)
            .name(PKG + form.getClassName())
            .annotateType(AnnotationDescription.Builder.ofType(EruptDataProcessor.class)
                    .define("value", DATA_PROCESSOR).build());
    // ERUPT_FLOW is null when erupt-flow is absent; skip without a hard dependency
    if (null != ERUPT_FLOW) {
        builder = builder.annotateType(AnnotationDescription.Builder.ofType(ERUPT_FLOW).build());
    }
    for (DesignerForm.DesignerField field : form.getFields()) {
        builder = builder.defineField(field.getFieldName(), javaType(field), Visibility.PRIVATE);
    }
    return builder.make()
            .load(DesignerClassFactory.class.getClassLoader(), ClassLoadingStrategy.Default.WRAPPER)
            .getLoaded();
}
```

源码：`erupt-designer/src/main/java/xyz/erupt/designer/service/DesignerClassFactory.java`

三个设计选择值得拆开看：

- **字段是真字段，类型是真类型**。`javaType()` 把编辑类型映射回 Java 类型——`NUMBER` 按 `fieldType` 落成 `Integer/Long/Double/BigDecimal`，`DATE` 落成 `Date`，`REFERENCE_TABLE/COMBINE` 落成 `Map`，`TAB_TABLE_ADD` 落成 `List`。因为字段是真的，Gson 转换、反射读写、Bean 校验这条管线**不需要任何特判**就能工作。
- **`WRAPPER` 策略 + 独立 classloader**。每次发布都加载进一个全新的 classloader，重新发布同名类只是产生一个新类，旧类自然变成垃圾被回收——这就是"改了字段不用重启"的代价分摊方式。
- **`@EruptFlow` 是软依赖**。erupt-flow 在 classpath 上时，注解被烤进字节码，审批流通过反射就能识别这个设计出来的模型；不在时整段跳过，不构成硬依赖。

:::tip 反直觉的小结
大多数设计器把"动态"理解成"别编译、用解释器"。erupt-designer 把"动态"理解成"**编译，但在运行时编译**"——动态的是编译时机，不是执行方式。执行方式始终是"运行一个真类"，所以它能 0 成本复用整个框架。
:::

## 五、关键能力二：JsonAnnotationProxy 把 JSON 伪装成真注解

字节码类只带了字段，没带 `@Erupt`/`@EruptField` 这些注解——注解的内容还在草稿 JSON 里。这里是第二个关键件：`JsonAnnotationProxy` 在运行时把 JSON 伪装成一个**真正的注解实例**。

它的契约很干净：草稿 JSON 里出现的成员覆盖模板注解，没出现的成员**穿透回模板的默认值**；嵌套注解递归代理，注解数组从模板的第一个元素当原型展开。

```java
public static <A extends Annotation> A proxy(A annotation, JsonObject json) {
    if (null == json) return annotation;
    return EruptProxyUtil.newProxy(annotation, invocation -> {
        JsonElement je = json.get(invocation.getMethod().getName());
        if (null == je || je.isJsonNull()) return invocation.proceed(); // fall through to template default
        return toValue(invocation.getMethod().getReturnType(), je, invocation);
    });
}
```

源码：`erupt-designer/src/main/java/xyz/erupt/designer/proxy/JsonAnnotationProxy.java`

于是 `EruptDesignerService.toEruptModel()` 做的事就是把这两半缝起来：ByteBuddy 造出的类提供字段载体，`JsonAnnotationProxy` 把草稿伪装成注解贴到 `EruptModel` 上——拼出来的 `EruptModel` 和扫描一个手写 `@Erupt` 类得到的，是同一种东西。

最后一块拼图是 `@EruptDataProcessor(DATA_PROCESSOR)`：它把这个动态类的增删改查路由到设计器自己的数据服务（而不是 JPA 实体表），所以设计出来的模型即使没有对应的 ORM 实体，也能存取数据。而设计器**自身**的元数据管理，用的恰恰是框架的标准扩展点——`DesignerEntityDataProxy implements DataProxy<DesignerEntity>`，在 `beforeAdd` 里校验类名唯一、`afterDelete` 里 `EruptCoreService.unregisterErupt(...)` 注销运行时模型。设计器在用框架管理框架。

## 六、跟 宜搭 / 简道云 / JNPF / JeecgBoot 怎么比？

| 维度 | **宜搭 / 简道云 / 明道云** | **JNPF / JeecgBoot 在线设计器** | **erupt-designer** |
| --- | --- | --- | --- |
| 运行物形态 | 被解释的 JSON DSL | 生成并落盘的 `.java`/`.vue` | **运行时编译的字节码类** |
| 加字段要重启吗 | 否 | **是**（重新生成 + 编译） | **否** |
| 设计稿与运行物 | 同一份 JSON | 易漂移（回 IDE 改即失真） | **草稿→类，单向编译，可反向导出源码** |
| 复用宿主 ORM / 校验 | 解释器自造 | 能（已是真类） | **直接复用，0 特判** |
| 接业务扩展点 | 平台事件 + 脚本 | 改生成代码 | **`DataProxy` / `FilterHandler` / `@EruptFlow`** |
| 审批流接入 | 平台内置 | 内置 + 改代码 | **classpath 有 erupt-flow 即自动识别** |
| 私有化 | 部分需企业版 | 自部署 | **自部署，单 jar** |
| 设计稿可被 code review 吗 | 截图 / 版本快照 | diff 生成的代码 | **可导出等价 `@Erupt` 源码 diff** |

我们不否认解释型设计器的价值——对没有工程团队的业务部门，浏览器里拖出一个 App 就是真实生产力。生成型也有它的位置，前提是你永远不回炉。

erupt-designer 的押注只在一个点上不同：**它拒绝引入"第二套语言"**。解释型引入了 JSON DSL，生成型引入了"生成代码"这个易漂移的中间态。erupt-designer 让设计稿在发布的一瞬间塌缩成框架本来就认识的东西——一个 `@Erupt` 类。之后框架里所有关于"类"的能力，它一行都不用重写。

## 七、5 分钟上手

从空 Spring Boot 项目到能访问的 admin 页面，通用起步流程已独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、`application.yml`、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，引入 designer 模块即可在后台菜单里多出"模型设计"入口：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-designer</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

进入设计器拖几个字段，点"预览"走的是 `POST /designer/preview`（不落库），点"发布"走 `POST /designer/publish/{className}`——发布完模型立刻出现在菜单里，**全程不重启**。想把它沉淀成正式实体？点导出，`GET /designer/java-code` 会还你一段可以直接粘进 IDE 编译的 `@Erupt` 源码。设计器到此功成身退，回到第 02 期那条"代码即配置"的主路上。

---

:::info 参与讨论
本期专题对应的核心源码在 [`erupt-designer`](https://github.com/erupts/erupt/tree/master/erupt-designer)——重点看 `service/DesignerClassFactory.java`、`service/EruptDesignerService.java` 与 `proxy/JsonAnnotationProxy.java`。
如果你的团队在"在线设计器"和"手写实体"之间踩过真实的迁移路径，欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，下次选题会优先考虑社区案例。
:::
