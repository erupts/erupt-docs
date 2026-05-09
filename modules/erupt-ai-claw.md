# 🦞 Erupt AI Claw

<a href="https://www.erupt.xyz/#!/ai-claw" target="_blank">
  <img src="/ai-claw/banner.png" width="1747">
</a>

:::info
Erupt AI Claw 让你通过自然语言直接驱动服务器——操作注解驱动的数据与业务、执行 Shell 命令、读写文件、扩展自定义 Skills，像与同事对话一样简单。

自进化智能体，干活学习两不误，几十种模型随便换，技能库自动扩容，对话记忆智能搜，可让 Agent 边干边学，普通电脑就能跑。
:::

[Erupt Engine](https://www.erupt.xyz/#!/ai-claw)

## 使用方法

```xml
<!-- 1.14.1 及以上版本支持 -->
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-claw</artifactId>
    <version>${LATEST}</version>
</dependency>
```

```yaml
erupt:
  ai:
    claw:
      enabled: true
```

> **注意：🦞 系统权限过大，生产环境切勿使用！安全第一！**

## ☄️ Token 准备

养 🦞 效果因模型而异，推荐使用主流的公有模型。

## 🦞 与 SKILL

:::info
支持与 70W+ 个 Skill 交互，也可通过提示词动态创建 Skill；erupt-🦞 将根据提示词自动匹配并执行对应 Skill。

skill 市场推荐：[https://skills.sh](https://skills.sh/)
:::

```shell
# 也可手动将 skill 文件放到如下目录
~/.erupt/skills/
```

**创建 SKILL**

<img src="/ai-claw/skill-create-1.png" width="792">

<img src="/ai-claw/skill-create-2.png" width="1252">

**执行 SKILL**

<img src="/ai-claw/skill-run-1.png" width="897">

<img src="/ai-claw/skill-run-2.png" width="763">

<img src="/ai-claw/skill-run-3.png" width="817">

<img src="/ai-claw/skill-run-4.png" width="752">

## 🦞 与 Erupt 模型交互

通过对话创建组织架构（数据新增）：

<img src="/ai-claw/erupt-create.png" width="1362">

**数据更新**

<img src="/ai-claw/erupt-update.png" width="1169">

**数据新增与创作**

<img src="/ai-claw/erupt-content.png" width="1756">

**查询模型数据**

<img src="/ai-claw/erupt-query.png" width="902">

## 🦞 与操作系统交互

<img src="/ai-claw/os-1.png" width="803">

<img src="/ai-claw/os-2.png" width="739">

<img src="/ai-claw/os-3.png" width="632">

## 🦞 与浏览器交互

配合 MCP 功能间接实现即可，在 MCP 菜单中增加如下配置：

```json
{
  "args": [
    "-y",
    "chrome-devtools-mcp@latest"
  ],
  "command": "npx"
}
```

<img src="/ai-claw/browser-1.png" width="1680">

<img src="/ai-claw/browser-2.png" width="1861">

## 🦞 与长期记忆

erupt-ai-claw 支持通过 Memory 工具实现跨会话的长期记忆持久化。

对话过程中，AI 会自动判断并将重要信息（技术决策、用户偏好、项目上下文等）写入记忆文件，下次会话开始时自动加载相关记忆，无需重复说明背景。

记忆文件默认存储于：

```shell
# 也可手动在此目录下创建 .md 文件，AI 将在下次会话时自动识别并读取。
~/.erupt/memory/
```

<img src="/ai-claw/memory-1.png" width="783">

<img src="/ai-claw/memory-2.png" width="748">

<img src="/ai-claw/memory-3.png" width="769">

<img src="/ai-claw/memory-4.png" width="730">

## 🦞 与 Spring Boot

支持通过对话获取服务的实时状态与配置信息。

**获取线程信息**

<img src="/ai-claw/spring-threads.png" width="759">

**获取配置信息**

<img src="/ai-claw/spring-config.png" width="759">

**获取 GC 信息**

<img src="/ai-claw/spring-gc.png" width="757">

**获取调度信息**

<img src="/ai-claw/spring-scheduler.png" width="756">
