# Erupt AI Claw

<a href="https://www.erupt.xyz/#!/ai-claw" target="_blank">
  <img src="/ai-claw/banner.png" width="1000">
</a>

:::info
Erupt AI Claw lets you drive the server directly through natural language — operating annotation-driven data and business, executing shell commands, reading and writing files, and extending custom Skills, as simply as chatting with a colleague.

A self-evolving agent that works and learns simultaneously, supports dozens of models interchangeably, auto-expands its skill library, and intelligently searches conversation memory. The agent learns while working and can run on an ordinary computer.
:::

[Erupt Engine](https://www.erupt.xyz/#!/ai-claw)

## Usage

```xml
<!-- Supported from version 1.14.1 and above -->
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
      # Whether to enable Claw
      enabled: true
      # Whether to allow executing shell commands (default false; must be enabled explicitly)
      enable-exec-shell: false
      # Allowlist of directories outside the sandbox where shell commands may run (absolute paths)
      shell-allowed-paths: []
      # Daily background archiving of stale skills (moved to .archive, never deleted)
      skill-curator-enabled: true
      # A skill unused for this many days is considered stale
      skill-stale-days: 30
```

:::warning
Claw has full tool permissions by default. **In production environments, restrict the available Tool scope via role configuration** (supported from v1.14.3+, see [Authorize Tools by Role](/en/modules/erupt-ai/tool-auth)). Security first!
:::

## Token Preparation

The effectiveness of Claw varies by model. Mainstream public models are recommended.

## Feature Guide

| Page | Contents |
|---|---|
| [Install & Use Skills](/en/modules/erupt-ai-claw/skill) | 700,000+ Agent Skills; create, patch and run Skills from the conversation |
| [Operate Erupt Data by Chat](/en/modules/erupt-ai-claw/erupt-model) | CRUD any Erupt model in natural language |
| [Shell & File Operations](/en/modules/erupt-ai-claw/os) | Sandboxed shell and file access, with layered guardrails |
| [Control a Browser](/en/modules/erupt-ai-claw/browser) | Drive a browser through the chrome-devtools MCP |
| [Long-Term Memory](/en/modules/erupt-ai-claw/memory) | Cross-session memory persisted per user |
| [Inspect App Runtime (Spring Boot)](/en/modules/erupt-ai-claw/spring-boot) | Threads, configuration, GC and scheduler info via chat |
| [Tool Reference & Role Authorization](/en/modules/erupt-ai-claw/tools) | Every built-in `@Tool`, authorized per role |
