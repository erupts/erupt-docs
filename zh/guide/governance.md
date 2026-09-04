# 治理与许可承诺

如果你正在评估把 Erupt 用于长期的内部系统，这一页回答你最该问的那个问题：**这套框架会不会在几年后突然改协议，逼我付费或者迁移？**

答案是不会，而且这个承诺以文件形式写在主仓：[`.github/GOVERNANCE.md`](https://github.com/erupts/erupt/blob/master/.github/GOVERNANCE.md)。本页是它的中文说明。

## 许可承诺

开源的 Erupt 框架 —— 包括但不限于 `erupt-core`、`erupt-annotation`、`erupt-jpa`、`erupt-mongodb`、`erupt-upms`、`erupt-security`、`erupt-web`、`erupt-ai`、`erupt-ai-claw`、`erupt-cloud`、`erupt-job`、`erupt-monitor`、`erupt-generator`、`erupt-magic-api`、`erupt-notice`、`erupt-print`、`erupt-terminal`、`erupt-websocket`、`erupt-toolkit`、`erupt-tpl`、`erupt-excel`，以及 [`erupts/erupt`](https://github.com/erupts/erupt) 仓库中当前与未来的**全部**模块 —— 始终以 **Apache License 2.0** 授权。

我们承诺以下四条：

| 承诺 | 含义 |
| --- | --- |
| **不改协议** | 不会转为 BSL、SSPL、Commons Clause、Elastic License 2.0 或任何非 OSI 认可的协议 |
| **不追溯变更** | 当前是 Apache 2.0 的代码将永远是 Apache 2.0；未来向开源仓库的贡献同样以 Apache 2.0 接受 |
| **独立演进** | 商业扩展模块（如 `erupt-flow`、`erupt-tenant`、`erupt-cube`）维护在独立的私有仓库，**不影响**开源核心的授权、路线图或功能集 |
| **开源优先** | Bug 修复、性能改进、通用能力**默认进开源核心**；只有明确面向企业级复杂场景的特性（多租户基础设施、语义层 BI、工作流引擎等）才作为商业模块发布 |

:::tip 这意味着什么
无项目数量限制 · 无商用限制 · 无授权文件 · 无功能阉割。Apache 2.0 从法律上保证了你永久拥有使用、修改、再分发的自由——**与本项目或维护者未来的任何走向无关**。
:::

## 开源核心 vs 商业模块

边界是按**仓库**划的，不是按功能开关划的：

| | 开源核心 | 商业模块 |
| --- | --- | --- |
| 仓库 | [`erupts/erupt`](https://github.com/erupts/erupt) 公开仓库 | 独立私有仓库 |
| 协议 | Apache 2.0，永久 | 商业授权 |
| 范围 | 注解引擎、UPMS、数据连接层、AI 能力、报表、云端等全部 50+ 模块 | 多租户、语义层 BI、工作流引擎 |
| 是否影响对方 | 否 | 否 |

换句话说：开源核心不会为了给商业模块让路而被削弱。**判断一个特性属于哪边的标准是「它是不是企业级复杂场景专属」，而不是「它值不值钱」。**

## 决策方式

- 项目由 YuePeng 与贡献者共同维护；
- 日常维护、Bug 修复、特性实现由维护者决定；
- 较大的架构变更会先在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 讨论再实施；
- 任何人都可以提特性、报 Bug、提 PR，流程见[贡献指南](/zh/guide/contributing)。

## 数据边界

治理不只是协议问题，也是数据问题。Erupt 唯一一处主动向外发起的网络请求是匿名遥测，它收集什么、怎么关、怎么自建，全部公开在[匿名遥测](/zh/guide/telemetry)一页。

除此之外，Erupt **不做任何形式的联网授权校验**——没有 license server，没有激活码，断网可以正常跑。

## 联系方式

- GitHub：[@erupts](https://github.com/erupts)
- 邮箱：erupts@126.com
- 讨论区：[GitHub Discussions](https://github.com/erupts/erupt/discussions)

## 相关

- [匿名遥测](/zh/guide/telemetry)
- [贡献指南](/zh/guide/contributing)
- [加入讨论](/zh/guide/community)
