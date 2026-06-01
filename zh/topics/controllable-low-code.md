---
title: "注解 × Spring × Git：史上最可控的低代码——没有'生成'这个动词"
description: 国内低代码圈讨论的"低代码"——拖拽画布、Node.js 在线脚本——一直是给业务运营用的。Erupt 押的是另一条路：低代码做给后端工程师，注解就是配置，扩展点就是 Spring Bean，真理在 Git 里，框架不向你的源码目录写任何文件——没有"生成"这个动词。这一期讲清楚"可控"在工程语境里到底是什么意思。
outline: deep
---

# 第 05 期 · 史上最可控的低代码

> 跟任何一个写了五年 Java 的后端聊"低代码"，他会列三件事：失控感、调试地狱、上限低。原因都不是"代码少"，是"代码不在他熟悉的地方"——不在 IDE、不在 Git、不在 breakpoint 上。Erupt 押的是反向那条路：**低代码不是少写代码，是把控制权完整地留在 IDE 里**，外加一份默认就在的 AI Harness——17 个 LLM、A2A 协议、跨会话 Memory、`@AiToolbox` 一行注解把任意 Spring Bean 暴露成 AI 工具。
>
> _发布于 2026-06-01 · 阅读 ~10 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

## 一、为什么写这篇

国内低代码圈里，每隔半年就会冒一波"开发者怎么看低代码"的讨论。底下的回复几乎是同一份模板：

- "我才不用，画布生成的代码我都不敢改。"
- "调试就是看后台日志，没法 breakpoint。"
- "复杂业务塞不下，最后还是要拉一份 Git 仓库写代码。"
- "我同事都是业务运营在用，开发用不上。"

把这些抱怨摞起来其实是同一件事：**控制权在哪里。**

现在主流低代码产品有两条路，**都没把控制权留给开发者**：

1. **拖拽画布派**：钉钉宜搭、腾讯微搭、简道云、明道云。控制权在 SaaS 后台。
2. **拖拽 + 在线脚本派**：JeecgBoot 在线表单 + Online Code、宜搭/微搭的 JS 编辑器、简道云的智能助手、若依 RuoYi 代码生成器。控制权部分还在 IDE，但**用户写的脚本和"画布生成的那部分代码"之间永远在漂移**——你回到 IDE 修一行，下次想用画布加字段就要承担同步成本。

这一期讲第三条路：**Erupt 把"可控"做到极致**——你写的每一行都是普通 Java，注解就是配置，扩展点都是 Spring Bean，调试就是 IDE breakpoint，版本管理就是 Git。同时**AI Harness 是默认能力，不是插件**——17 个 LLM、A2A 跨 Agent、跨会话 Memory、`@AiToolbox` 暴露任意 Bean 给 LLM 调用，**装好就能用**。

::: tip 一个反直觉的小结
"低代码"在国内市场被几乎绑死成"给业务运营用"的产品。Erupt 主张的是另一种语义——**做给后端工程师的低代码**。它的衡量标准不是"业务零代码上线"，而是"工程师写的代码量从 800 行降到 80 行，剩下 720 行的控制力一点没丢"。
:::

## 二、开发者讨厌低代码的三件事

把后端工程师抵触低代码的理由拆开，本质就这三条：

| 抵触点 | 拖拽派<br/>(宜搭/微搭/简道云) | 拖拽 + 脚本派<br/>(JeecgBoot Online Code/微搭 JS) | **Erupt** |
| --- | --- | --- | --- |
| 控制权在哪 | SaaS 画布的内部 DB | 一半在生成代码，一半在画布 | **Git 里的 .java 源文件** |
| 怎么调试 | 看后台日志 | console.log + 平台日志 | **IDE breakpoint** |
| 怎么 diff / review | 截图对比 | `git diff` 自动生成代码（噪音大） | **`git diff` 注解** |
| 复杂逻辑上限 | 表单事件 + 内嵌 JS | 在线 IDE，文件不在本机 | **任意 Spring Bean** |
| CI/CD | SaaS 应用包导入导出 | jar + SQL 同步 | **`mvn package` → jar** |
| 单测 | 几乎不可能 | 改完代码下载到本机才能跑 | **JUnit + erupt-test (H2)** |
| AI 能力 | 通常需要"AI 加件"额外购买 | 通常需要外接 LangChain / Coze | **erupt-ai 是默认依赖** |

最后一行是这期讲的第二件事——**当大家都在卷"低代码 + AI 加件"的时候，Erupt 把 AI Harness 做成了默认依赖**：你引完 starter，17 个 provider 已经在那里，扩展点也已经在那里，只差你把 LLM 的 API key 填进去。

## 三、"可控"在工程语境里到底是什么意思

听到"可控"两个字，国内厂商最常翻译成"可视化配置项更多"——能拖的字段更多、能配的规则更多。这跟工程师想要的"可控"是两个东西。

工程师视角的"可控"非常具体：

1. **每一行代码都在我 IDE 里**——按 `⌘ + B` 能跳到定义，按 `⌘ + F12` 能列出所有调用方。
2. **每一个状态都在 Git 里**——`git log` 能看到谁在哪天改了哪个字段的标题。
3. **每一个分支都可 review**——`git diff` 的产出是开发者看得懂的，不是机器生成的 1200 行 Vue 代码。
4. **每一个错误都可 breakpoint**——出问题时，断点 + step over，不是去翻一份不在本机的运行时日志。
5. **每一个扩展点都是 Spring Bean**——熟悉的 `@Service`、`@Autowired`、`@Transactional`，没有"低代码运行时"那一层我不熟的抽象。

Erupt 给的就是这五条。看一个最小例子——一个客户管理后台：

```java
@Erupt(
    name = "客户",
    dataProxy = CustomerDataProxy.class,
    power = @Power(importable = true, export = true)
)
@Table(name = "t_customer")
@Entity
public class Customer extends BaseModel {

    @EruptField(
        views = @View(title = "客户名"),
        edit = @Edit(title = "客户名", notNull = true, search = @Search(vague = true))
    )
    private String name;

    @EruptField(
        views = @View(title = "等级"),
        edit = @Edit(title = "等级", type = EditType.CHOICE,
            choiceType = @ChoiceType(vl = {
                @VL(value = "A", label = "A 类"),
                @VL(value = "B", label = "B 类")
            }))
    )
    private String level;
}

@Service
@RequiredArgsConstructor
public class CustomerDataProxy implements DataProxy<Customer> {

    private final RiskClient risk;

    @Override
    public void beforeAdd(Customer model) {
        if (risk.isBlacklisted(model.getName())) {
            throw new EruptException("该客户在风控黑名单中");
        }
    }
}
```

数一下控制权落点：
- 字段是 Java 字段 → IDE 自动补全、重构、find usages 全部生效。
- 校验逻辑在 `beforeAdd` → 直接挂 breakpoint，单测里 mock `RiskClient` 就能跑。
- 风控调用走 `@Autowired` → 跟项目里其他 Spring 服务一个待遇，没有"低代码 runtime 调外部接口"那种黑盒。

::: info 别忽视这件事
所有这些**没有一行代码是框架生成的**。`Customer.java` 是你 IDE 里手敲的，`CustomerDataProxy.java` 也是。Erupt 不向你的源码目录里写任何文件——区别于 JeecgBoot / JNPF 的"画布生成代码"路径，**Erupt 没有"生成"这个动词**。
:::

## 四、扩展点矩阵：每一类需求都有对应 Spring Bean

后端工程师不是抵触"少写代码"，是抵触"被迫离开我熟悉的扩展机制"。Erupt 的扩展点全部以 Spring Bean / Java 接口的形式存在，没有"配置面板"那一层：

| 想做什么 | 实现接口 | 在哪 |
| --- | --- | --- |
| 增删改查生命周期 | `DataProxy<T>` | `xyz.erupt.annotation.fun.DataProxy` |
| 自定义查询过滤 | `FilterHandler` | `xyz.erupt.annotation.fun.FilterHandler` |
| 行级权限 | `PowerHandler` | `xyz.erupt.annotation.fun.PowerHandler` |
| 行级操作按钮 | `OperationHandler` | `xyz.erupt.annotation.fun.OperationHandler` |
| 下拉选项 | `ChoiceFetchHandler` / `TagsFetchHandler` | `xyz.erupt.annotation.fun.*` |
| 输入联想 | `AutoCompleteHandler` | `xyz.erupt.annotation.fun.AutoCompleteHandler` |
| 类型安全查询 | `eruptDao.lambdaQuery(...)` | `xyz.erupt.jpa.dao.EruptDao` |

这张表里没有任何"在画布配 X"，全部是"实现 Y 接口"。**对一个写过 Java 的人，这一张表就是他原本熟悉的 Spring 接口注册模型——抵触没有滋生的空间。**

## 五、AI 不是"装一个 ChatGPT 插件"，而是默认能力

第二件让开发者抵触的事情：**国内低代码 + AI 几乎都是"加件"**——你要先有平台，再买 AI 模块，再配 LLM key，再单独学一遍它家的 Agent 配置 DSL。

Erupt 把这一层做反了。`erupt-ai` 跟 `erupt-core` 一样是默认依赖，引完 starter 之后整个 AI Harness 已经在那里：

```text
erupt-ai/src/main/java/xyz/erupt/ai/llm/
├── ChatGpt.java       Claude.java       DeepSeek.java
├── Doubao.java        Fireworks.java    Gemini.java
├── GLM.java           Grok.java         MiniMax.java
├── Mimo.java          Mistral.java      Moonshot.java
├── Ollama.java        OpenAIAdapter.java
├── OpenRouter.java    Qwen.java         Together.java
```

数一下：**17 个 provider，全部在主仓**，不是远端商店的插件。基础设施 `LlmCore`、`LLMService`、`AiToolboxManager`、`A2AAgentService` 也全部是主仓代码。

接下来这件事才是关键——**怎么把你自己的业务 Bean 让 LLM 调到？**

一行注解。看 `xyz.erupt.annotation.ai.AiToolbox` 的真实定义，整整 12 行：

```java
package xyz.erupt.annotation.ai;

import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Documented
@Inherited
public @interface AiToolbox {
}
```

一个空标记注解。运行时它会被 `AiToolboxManager` 扫到——这段 `xyz.erupt.ai.core.AiToolboxManager` 的核心实现，简单到看一眼就懂：

```java
@Override
public void run(ApplicationArguments args) {
    applicationContext.getBeansWithAnnotation(AiToolbox.class).values().forEach(bean -> {
        Object target = AopProxyUtils.getSingletonTarget(bean);
        Object realBean = target != null ? target : bean;
        tools.add(realBean);
        for (Method method : realBean.getClass().getDeclaredMethods()) {
            if (method.isAnnotationPresent(Tool.class)) {
                aiMethodMap.put(method.getName(), method);
                aiMethodBeanMap.put(method.getName(), realBean);
            }
        }
    });
}
```

启动时扫一遍带 `@AiToolbox` 的 Spring Bean，把里面带 langchain4j `@Tool` 注解的方法登记进去——就这样，**你的业务 Bean 直接成了 LLM 工具**。

写一个能让 AI 调用的内部 CRM 查询：

```java
@AiToolbox
@Service
@RequiredArgsConstructor
public class CustomerAiTools {

    private final EruptDao eruptDao;

    @Tool("根据客户名模糊查询，返回前 20 条客户基本信息")
    public List<Customer> searchCustomerByName(
            @P("客户名关键字") String keyword) {
        return eruptDao.lambdaQuery(Customer.class)
                .like(Customer::getName, keyword)
                .limit(20)
                .list();
    }

    @Tool("把指定客户拉入风控黑名单")
    public String blacklist(@P("客户 ID") Long customerId) {
        Customer c = eruptDao.lambdaQuery(Customer.class)
                .eq(Customer::getId, customerId).one();
        if (c == null) return "客户不存在";
        c.setLevel("BLACKLIST");
        eruptDao.merge(c);
        return "已拉黑：" + c.getName();
    }
}
```

工程师视角看这段代码：**100% 是普通 Spring Bean**——`@Service`、`@Autowired`（Lombok 的 `@RequiredArgsConstructor` 代换）、`EruptDao` 的 lambda 查询。多出来的只有 `@AiToolbox` 一个类注解和方法上的 `@Tool`。下一次 LLM 收到用户消息"帮我查叫'张三'的客户"，它自己就能调到 `searchCustomerByName`。

整套 AI Harness 包含的还远不止这些。把 Erupt 现状摆出来——

| 能力 | Erupt 现状 | 国内对位 |
| --- | --- | --- |
| LLM provider 数量 | 17 个内置 | 一般 1–3 个，扩展靠插件 |
| 多 Agent 协作（A2A） | `xyz.erupt.ai.service.A2AAgentService` 内置 | 几乎都要外接 LangGraph / Mastra |
| 跨会话 Memory | `xyz.erupt.ai.model.AiMemory` 内置 | 一般需要自己集成 Redis 方案 |
| MCP server | `xyz.erupt.ai.service.McpServerService` 内置 | 几乎没有原生支持 |
| 把 Spring Bean 暴露成 Tool | `@AiToolbox` + `@Tool`，一行 | 通常需要写 schema JSON 注册 |
| 自治 Admin Agent | `erupt-ai-claw` 模块 | 一般是另购 |

`erupt-ai-claw` 单独说一句——这是 Erupt 默认提供的**自治 Admin Agent**：它知道当前后台有哪些 `@Erupt` 类、哪些字段、哪些行级操作，能直接代用户去查数据、改数据、跑系统操作（受 `LLMRoleService` 的 RBAC 控制）。在 #01 那期 [50+ LLM × A2A × Memory](/zh/topics/50-llm-a2a-memory) 里展开过它的内部。

## 六、跟 JeecgBoot Online Code / 钉钉宜搭 JS / 微搭 JS 怎么比？

主流"拖拽 + 脚本派"的核心问题：**你写的脚本和画布生成的代码之间永远在漂移**。把横向摆开：

| 维度 | JeecgBoot Online Code | 钉钉宜搭 JS / 微搭 JS | 简道云脚本 | **Erupt** |
| --- | --- | --- | --- | --- |
| 业务逻辑写在哪 | 平台在线 IDE 的 Groovy / Java 片段 | SaaS 表单事件里的 JS 函数 | 简道云内嵌脚本编辑器 | **本机 IDE 的 Spring Bean** |
| 调试 | 平台日志 | 浏览器 console | 平台日志 | **本机 IDE breakpoint** |
| 单元测试 | 难（脚本不在仓库里） | 几乎不可能 | 几乎不可能 | **JUnit + erupt-test (H2)** |
| 复用 Spring 生态 | 部分 | ❌ | ❌ | **完全可用（Spring Boot 3.5）** |
| 包管理 | 平台内置 jar | 平台白名单 | 平台白名单 | **`pom.xml` 任意依赖** |
| AI 工具暴露 | 需平台层 AI 模块 | 需"低代码 + AI"加件 | 需智能助手套件 | **`@AiToolbox` 一行注解** |
| CI/CD | 应用包导出 | 应用包导入 | 应用包导入 | **标准 `mvn package`** |

注意这张表里第一列（**业务逻辑写在哪**）的差异——前三列把开发者最熟悉的"业务逻辑"那部分代码扣留在平台内部 IDE 或浏览器编辑器里，**离开了开发者熟悉的工作流**。Erupt 没扣留任何东西。

## 七、5 分钟从零搭一个可控 + 带 AI 的后台

通用的 Spring Boot + Erupt 起步流程独立在 quick-start 一页：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 `@Erupt` 实体、默认登录账号、Docker / K8S 部署。

跑通之后，**这一期相关的 AI 部分**只多两步——`pom.xml` 引 `erupt-ai`、yml 里填一个 LLM key：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
</dependency>
```

启动后进入后台菜单 **AI → LLM 配置**，新建一条 DeepSeek（或任意其他 provider），填 API key 就能在聊天框里跑。然后在你的项目里随手加一个：

```java
@AiToolbox
@Service
public class MyTools {
    @Tool("说当前时间")
    public String now() { return LocalDateTime.now().toString(); }
}
```

重启，再问 AI"现在几点"——它会调你这个方法。

整个过程**没有任何一步离开 IDE**。

## 八、下一期预告

第 06 期会接着这条"可控 + AI 默认"的线再走一步——讲 `erupt-ai-claw` 这个自治 Admin Agent 里的三件内置工具：`EruptMemoryTools`、`EruptModelTools`、`EruptSystemTools`。它们让 LLM 反过来读 Erupt 元数据、操作 Erupt 模型、甚至调 shell——也讲清楚 `LLMRoleService` 的 RBAC 是怎么把这套自治能力关在笼子里的。

那一篇我们会回答一个被反复问到的问题：**"让 AI 在后台跑得动，又怎么不出事？"**

---

:::info 参与讨论
本期专题对应的核心源码：

- `xyz.erupt.annotation.fun.DataProxy` — 业务生命周期扩展点
- `xyz.erupt.annotation.ai.AiToolbox` — 把 Spring Bean 标记为 AI 工具集
- `xyz.erupt.ai.core.AiToolboxManager` — 启动时扫描 `@AiToolbox` 并注册到 LLM
- `xyz.erupt.ai.core.LlmCore` / `xyz.erupt.ai.service.LLMService` — 17 个 provider 的注册与热切换

欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
