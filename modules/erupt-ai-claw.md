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
      # 是否启用 Claw
      enabled: true
      # 是否允许执行 Shell 命令（默认 true，生产环境建议设为 false）
      enable-exec-shell: true  # v1.14.3+
```

:::warning
🦞 默认拥有全量工具权限，**生产环境请通过角色配置限制可用 Tool 范围**（v1.14.3+ 支持，详见 [角色级 Tool 授权](/modules/erupt-ai#角色级-tool-授权)），安全第一！
:::

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

## 🔐 角色级动态 Tool 授权 <Badge type="tip" text="v1.14.3+" />

:::tip
Claw 的能力边界由角色决定。管理员天然持有全量工具，其余角色仅能调用被显式授权的 Tool——高危操作对无权角色完全不可见、不可调用，使 Claw 具备在生产环境安全部署的能力，同时实现 AI 能力千人千面。
:::

在 erupt-ai 的角色管理界面中为每个角色勾选可用 Tool，并配置专属系统提示词，保存即时生效，无需重启。详见 [角色级 Tool 授权](/modules/erupt-ai#角色级-tool-授权)。

## @Tools 说明表

以下为 Erupt AI Claw 内置的全部 `@Tool`，可在角色配置界面中按需勾选授权。

### 系统工具

| Tool | 说明 |
|---|---|
| `getCurrentDateTime` | 获取当前日期与时间 |
| `execShell` | 执行 Shell 命令（⚠️ 高危，建议仅授权管理员） |

### Spring Boot

| Tool | 说明 |
|---|---|
| `getActiveProfiles` | 获取当前激活的 Spring Profile |
| `getProperty` | 读取指定 Spring 配置属性值 |
| `getScheduledTasks` | 获取 Spring 调度任务列表 |

### JVM 监控

| Tool | 说明 |
|---|---|
| `getJvmMemory` | 获取 JVM 堆内存使用情况 |
| `getJvmUptime` | 获取 JVM 已运行时长 |
| `getThreadInfo` | 获取 JVM 线程详情 |
| `getGcStats` | 获取垃圾回收统计信息 |

### Erupt 数据

| Tool | 说明 |
|---|---|
| `eruptModelList` | 获取所有 Erupt 模型列表 |
| `eruptSchema` | 获取指定 Erupt 模型的字段 Schema |
| `eruptDataQuery` | 查询 Erupt 模型数据列表 |
| `findEruptDataByPk` | 按主键查询单条 Erupt 数据 |
| `insertEruptData` | 向 Erupt 模型新增一条数据 |
| `updateEruptData` | 更新 Erupt 模型中的数据 |
| `deleteEruptData` | 删除 Erupt 模型中的数据 |
| `getEruptModules` | 获取已加载的 Erupt 模块列表 |
| `geneEruptCode` | 生成 Erupt 模型代码 |

### Erupt 用户

| Tool | 说明 |
|---|---|
| `eruptUserInfo` | 获取当前登录用户信息 |
| `eruptUserPermissions` | 获取当前用户的权限信息 |

### Cube 分析

| Tool | 说明 |
|---|---|
| `cubeList` | 列出所有 Cube 数据集 |
| `cubeMetadata` | 获取指定 Cube 数据集的元数据 |
| `cubeQuery` | 执行 Cube 数据集查询 |

### Skill 管理

| Tool | 说明 |
|---|---|
| `listSkills` | 列出所有可用 Skill |
| `getSkillDetail` | 获取指定 Skill 的详情 |
| `readSkillFile` | 读取 Skill 文件内容 |
| `saveSkill` | 创建或更新 Skill |
| `deleteSkill` | 删除指定 Skill |

### 记忆管理

| Tool | 说明 |
|---|---|
| `listMemories` | 列出所有记忆条目 |
| `getMemory` | 获取指定记忆内容 |
| `saveMemory` | 保存一条记忆 |
| `deleteMemory` | 删除指定记忆 |
