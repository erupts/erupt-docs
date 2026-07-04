---
title: "注解里写的不是字符串，是有语法的代码"
description: 画布党最爱的反驳是"注解就是把 SQL 写成没高亮的哑字符串"。Erupt 押反向——用 JetBrains @Language 往自己的注解属性里注入 10 种嵌入式语言，一行 sql="..." 在 IntelliJ 里有高亮、补全、报错；@Comment 再让同一个属性对人和 AI 都自描述。
outline: deep
---

# 第 08 期 · 注解里写的不是字符串，是有语法的代码

> 反对注解式低代码的人有一句话最扎心：**"你把 SQL、模板、脚本全塞进注解字符串里，没高亮、没补全、写错了编译都不报错——这不就是退回记事本时代？"**
> 这一期我们把这句话拆开：Erupt 往自己的注解属性上注入了 **10 种嵌入式语言**，那行 `sql = "..."` 在 IntelliJ 里是有语法高亮、有补全、有实时报错的；`@Comment` 再让同一个属性对人和 AI 同时可读。
>
> _发布于 2026-07-01 · 阅读 ~9 min_

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

第 02 期我们讲了"为什么没去做拖拽画布"，第 05 期讲了"注解就是配置"。每次讲完，评论区总会飘上来同一条反驳——

> "拖拽画布的在线脚本编辑器至少有语法高亮和补全，你注解里写一坨 `sql = "sum(amount)"`，写错字段名要等到运行时才炸。注解式低代码的开发体验就是退回记事本。"

这条反驳**在大多数注解框架上是成立的**。Java 注解属性的类型是 `String`，编译器只认它是一段字符——里面是 SQL 还是 Velocity 模板还是 markdown，`javac` 不知道，IDE 默认也不知道。于是你在注解里写的每一段"嵌入式代码"都是裸奔的。

这一期讲的是我们对这条反驳的回答，而且它不是靠一个自研插件、不是靠一套 DSL 编译器——**它靠的是 JetBrains 早就放在那儿、大多数人没用起来的一个注解 `@Language`，加上 Erupt 自己的 `@Comment`。**

本文的反向命题很简单：

> **注解属性里的字符串，不该被当成哑字符串。它是一块可以被 IDE 注入语法、当成子语言编辑器来对待的画布——而且这块画布长在真 IDE 里，白送 refactor、git、debugger。**

## 二、一个属性字符串的三重身份

先把范式框出来。在 Erupt 里，一个注解属性上的字符串同时背着三个身份：

| 身份 | 面向谁 | 靠什么点亮 |
| --- | --- | --- |
| **配置值** | 框架运行时 | Java 注解本身，Gson 反射读取 |
| **嵌入式语言编辑面** | 写代码的工程师 | `@Language(...)`——IDE 注入子语言语法 |
| **自描述文档 / AI 上下文** | 人（IDE hover）+ 机（LLM） | `@Comment(...)` + `prompt()` 属性 |

同一段 `sql = "sum(amount)"`，运行时是聚合表达式，编码时是一块 SQL 编辑器，读代码时是一句能被人和模型一起读懂的说明。三个身份共用一份真理——**注解字符串本身**，不复制、不派生。

这正是 Erupt 一以贯之的赌注在开发体验层面的延续：**元数据是唯一真理来源**。第 03 期讲的是元数据 = UI = API = LLM Tool；这一期讲的是，连"这段字符串是什么语言、给谁看"这件事，也压进了元数据。

## 三、10 种被注入注解的嵌入式语言

先给可数的事实。把主仓 `erupt-annotation` 里所有 `@Language(...)` 的注入目标语言统计一遍：

| 注入语言 | 出现处数 | 典型属性 |
| --- | --- | --- |
| `hql` | 21 | `@Search` 过滤、`@Edit` 排序、`Join.on` 条件 |
| `java` | 14 | `datasource`（`private String ...;`）、`drillFields`（`Object get(){...}`） |
| `markdown` | 6 | 所有 `prompt()`（AI 提示词） |
| `sql` | 5 | `@Measure.sql` 聚合、`Join.type` |
| `javascript` | 3 | 前端联动脚本 |
| `VTL`（Velocity） | 2 | `@EruptCube.sql` / `@Dimension.sql` 模板 |
| `html` | 2 | 图标 class（`<i class="...">`） |
| `file-reference` | 2 | 资源路径 |
| `css` | 1 | 自定义样式 |
| `spel` | 1 | 框架内部注解序列化（不对用户暴露） |

一共 **10 种子语言**，散在 29 个属性上；配套的 `@Comment` 在主仓出现 **73 处**。

:::tip 一个反直觉的小结
大多数框架把"注解里能写表达式"当卖点，却把"这个表达式是什么语言"这件事丢给了工程师的记忆。Erupt 把语言种类本身也变成了元数据——`javac` 不在乎，但 IDE 在乎，而工程师每天面对的是 IDE。
:::

## 四、关键能力一：`@Language` + prefix/suffix，让"半句 SQL"也能高亮

`@Language` 是 JetBrains 放在 `org.intellij.lang.annotations` 里的注解。给一个 `String` 属性打上它，IntelliJ 就会把这个字符串当对应语言来处理：高亮、补全、错误检查、甚至格式化。

难点在于：注解里写的往往不是**完整**语句，而是一个**片段**。比如 `@Search` 的过滤表达式，你只写 `status = 'DONE'`，它不是合法 SQL——IDE 该怎么高亮？

Erupt 的答法是 `prefix` / `suffix`——**告诉 IDE 把片段前后各拼一段，凑成合法语句再去解析**。看主仓 `Measure` 的真实源码：

```java
public @interface Measure {

    String title();

    @Comment("Aggregate SQL expression, e.g. sum(amount)")
    @Language(value = "sql", prefix = "select ")
    String sql();

    @Comment("Dimension fields exposed when drilling down")
    @Language(value = "java", prefix = "Object get() { ", suffix = ";}")
    String[] drillFields() default {};

    @Comment("Extra filter applied when drilling down")
    @Language(value = "sql", prefix = "select * from x where ")
    String drillFilter() default "";
}
```

三个属性、三种拼法：

- `sql()` 前缀 `select `——你写 `sum(amount)`，IDE 当成 `select sum(amount)` 来校验聚合函数；
- `drillFields()` 前缀 `Object get() { `、后缀 `;}`——你写的下钻字段被当成一段 **Java 表达式**来补全；
- `drillFilter()` 前缀 `select * from x where `——你写的下钻过滤片段被当成 WHERE 条件来高亮。

`@Search` 里更典型（`erupt-annotation/.../sub_field/Edit.java`）：

```java
@Comment("Sort expression; applicable when the field type is an ORM entity object")
@Language(value = "sql", prefix = "select * from t order by")
String sort() default "";
```

包名写全：`org.intellij.lang.annotations.Language` + `xyz.erupt.annotation.config.Comment`。这两个注解本身不参与运行时逻辑——它们只在**编码那一刻**对 IDE 说话。运行时读到的还是那个干净的字符串。

这就是对第一节那条反驳的正面回击：**注解里的 SQL 片段不是裸奔的，它前后被拼成合法语句喂给了 IntelliJ 的 SQL 引擎。字段名写错、函数名拼错，红波浪线当场出现——不用等运行时。**

## 五、关键能力二：`@Comment`，让同一个属性对人和 AI 都自描述

高亮解决"写得对不对"，`@Comment` 解决"这是干嘛的"。它是 Erupt 自己的注解，可以打在类型、字段、方法、参数上，还带一个语言枚举：

```java
@Repeatable(Comments.class)
@Target({METHOD, TYPE, FIELD, TYPE_PARAMETER, PARAMETER})
public @interface Comment {
    String value();
    Language language() default Language.ZH;
    enum Language { ZH, EN }
}
```

在注解声明里，`@Comment` 是给**下一个写这个注解的人**看的悬浮说明；而在 AI 侧，Erupt 另开了一条更直接的通道——每个面向数据的注解都带一个 `prompt()`，且它本身也被 `@Language("markdown")` 注入：

```java
@Comment("AI prompt")
@Language("markdown")
String prompt() default "";
```

看它在 `@EruptCube` 上的位置，一切串起来了：

```java
@EruptCube(
        name = "Work Item Statistics",
        sql = """
                select wi.type    as type,
                       wi.status  as status,
                       u.name     as assignee_name
                from e_project_work_item wi
                     left join e_upms_user u on wi.assignee_id = u.id
                """
)
public class WorkItemStatsCube {
    @Dimension(title = "Assignee", sql = "assignee_name")
    private String assigneeName;

    @Measure(title = "Overdue Count",
             sql = "sum(case when status <> 'DONE' and due_date < current_date then 1 else 0 end)")
    private Long overdueCount;
}
```

这段代码里：那坨多行 `sql` 是被 `@Language("VTL")` 注入的 Velocity 模板（IDE 认得 `${...}` 占位）；`@Measure.sql` 是被当成 SQL 片段高亮的聚合式；每个 `prompt` 是被当成 markdown 编辑的 AI 上下文。第 04 期讲的"LLM 在 cube 旁长出三只眼睛"，其元数据养料正是这些 `@Comment` 与 `prompt`——**LLM 读到的字段说明，和你在 IDE 里 hover 看到的，是同一份**。

一份注解，三种消费者各取所需，没有第二处副本要维护。

## 六、跟宜搭 / 简道云 / JeecgBoot 怎么比？

画布派把"在线脚本编辑器有高亮"当成对代码派的优势。我们把这条对位摊开看：

| 维度 | 宜搭 / 简道云 / 明道云（在线脚本） | JeecgBoot（在线开发 + 生成代码） | Erupt（`@Language` 注入注解） |
| --- | --- | --- | --- |
| 表达式在哪写 | 平台内嵌脚本框 | 在线配置 → 生成 service | **真源码的注解属性里** |
| 语法高亮 | 平台自制编辑器，语言有限 | 生成后才在 IDE 里 | **IntelliJ 原生，10 种子语言** |
| 片段校验 | 运行时 / 保存时 | 生成后编译时 | **编码即时，prefix/suffix 拼合法句** |
| 重构（改字段名） | 手动全局搜 | 重新生成，易漂移 | **IDE Rename 跟着走** |
| 版本管理 | 平台数据库存 JSON | 生成物进 git，配置不进 | **注解即源码，天然进 git** |
| 断点调试 | 无 | 生成的 service 可调 | **和普通 Java 一样打断点** |
| 给 AI 的上下文 | 无标准通道 | 无 | **`@Comment` + `prompt()` 同源** |

我们不是说画布派的在线编辑器不好——面向业务运营、要"不装 IDE 就能改"的场景，它们的主场稳。但对**后端工程师**来说，"高亮"从来不是画布的专利，它是 IDE 的能力；把逻辑写回真源码，你拿到的不止高亮，还有 IDE 二十年攒下的整套工具链。`@Language` 做的只是把这套能力接到注解字符串上，一分钱自研编辑器都不用写。

## 七、5 分钟从注解到界面

这套开发体验不需要额外依赖——只要你用 IntelliJ 打开一个 Erupt 工程，`@Language` 注入就自动生效。想先跑通第一个 `@Erupt` 实体、看到 admin 界面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、`application.yml`、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后回到本文：随便打开一个 `@Search` 或 `@EruptCube`，把光标放进 `sql = "..."` 里，按 `Alt+Enter` 看看 IntelliJ 弹出的 "Edit SQL Fragment"——你就摸到 §四、§五 讲的那块画布了。

---

:::info 参与讨论
本期专题对应的核心源码：`xyz.erupt.annotation.cube.Measure`、`xyz.erupt.annotation.sub_field.Edit`、`xyz.erupt.annotation.config.Comment`，以及 JetBrains 的 `org.intellij.lang.annotations.Language`。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴，聊聊你在注解里注入过哪些子语言。
:::
