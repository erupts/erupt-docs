# 🦞 Erupt AI Claw

<a href="https://www.erupt.xyz/#!/ai-claw" target="_blank">
  <img src="/ai-claw/banner.png" width="1000">
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
      # 是否允许执行 Shell 命令（默认 false，需显式开启）
      enable-exec-shell: false
      # 沙箱之外允许 Shell 命令运行的目录白名单（绝对路径）
      shell-allowed-paths: []
      # 是否启用 Skill 自动整理（每日后台将长期未用的 Skill 归档至 .archive，不会删除）
      skill-curator-enabled: true
      # Skill 超过多少天未使用视为闲置
      skill-stale-days: 30
```

:::warning
🦞 默认拥有全量工具权限，**生产环境请通过角色配置限制可用 Tool 范围**（v1.14.3+ 支持，详见 [按角色授权 Tool](/zh/modules/erupt-ai/tool-auth)），安全第一！
:::

## ☄️ Token 准备

养 🦞 效果因模型而异，推荐使用主流的公有模型。

## 功能导航

| 页面 | 内容 |
|---|---|
| [安装与使用 Skill](/zh/modules/erupt-ai-claw/skill) | 对接 70W+ Agent Skills，对话中创建、修补与执行 Skill |
| [对话操作 Erupt 数据](/zh/modules/erupt-ai-claw/erupt-model) | 用自然语言对任意 Erupt 模型做增删改查 |
| [执行 Shell 与文件操作](/zh/modules/erupt-ai-claw/os) | 沙箱内执行 Shell、读写文件，以及多层安全防护 |
| [操控浏览器](/zh/modules/erupt-ai-claw/browser) | 借助 chrome-devtools MCP 驱动浏览器 |
| [长期记忆](/zh/modules/erupt-ai-claw/memory) | 跨会话、按用户隔离的记忆持久化 |
| [查看应用运行状态（Spring Boot）](/zh/modules/erupt-ai-claw/spring-boot) | 对话获取线程、配置、GC、调度等运行时信息 |
| [工具清单与角色授权](/zh/modules/erupt-ai-claw/tools) | 全部内置 `@Tool` 说明表，按角色勾选授权 |
