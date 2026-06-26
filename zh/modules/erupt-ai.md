# Erupt AI 大模型深度集成

与当下流行的大模型深度集成，低代码开发大模型应用。

<a href="https://www.erupt.xyz/#!/ai" target="_blank">
  <img src="/ai/banner.png" width="1747">
</a>

:::tip 全面拥抱 Harness Engineering
:::

| **能力** | **说明** |
|---|---|
| **LLM** | 支持：ChatGPT、Claude、Gemini、Ollama、Qwen、Doubao、GLM、DeepSeek、Moonshot、MinMax、Mistral、Grok、Fireworks、Together、OpenRouter 等 |
| **Chat** | 会话管理（AiChat）、消息历史（AiChatMessage）、SSE 流式输出、可配置上下文轮次（maxContext） |
| **Agent** | 自定义可视化控制 Prompt、可动态控制 Agent 提示词 |
| **Tools** | 通过 `@AiToolbox` + `@Tool` 注册工具并在对话中调用；EruptAiToolbox 提供基础模型列表、Schema、当前用户、HQL 查询、模块列表等能力 |
| **MCP** | 支持挂载外部 MCP Server，灵活扩展工具能力 |
| **MCP Server** | 内置 MCP Server，Bearer 鉴权，支持 Cursor / Claude 等客户端直连 |
| **Security** | 内置严格的接口权限控制，AI 聊天能力可以通过用户权限动态授予 |

## 快速接入

1. 添加依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. 可配置项：

```yaml
erupt:
  ai:
    # 定义全局系统提示词
    system-prompt: |
      你是 Erupt AI，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。
      同时，你会拒绝一切涉及恐怖主义，种族歧视，黄色暴力等问题的回答。
      Erupt AI 为专有名词，不可翻译成其他语言。
    # SSE 超时时间
    sse-timeout: 300000
    # 打字配置
    message-chunk-size: 20
    message-delay: 30
```

3. 启动后会增加如下菜单：

<img src="/ai/menu.png" width="1770">

4. 交互式对话：

<img src="/ai/chat.png" width="1680">

## 驾驭任意 LLM 引擎

增加对应的大模型，对应的 key 到大模型官网中申请即可。

<img src="/ai/llm-list.png" width="1770">

<img src="/ai/llm-config.png" width="1770">

点击对应图标测试大模型会话：

<img src="/ai/llm-test.png" width="1770">

## 沉浸式 AI 对话

:::tip
与大模型自然对话，所见即所得——代码高亮、Mermaid 图表、数学公式实时渲染，支持工具自动调用与智能体编排，让每一次交互都触达 AI 的真实能力边界。
:::

<img src="/ai/chat-code.png" width="632">

<img src="/ai/chat-chart.png" width="743">

<img src="/ai/chat-math.png" width="768">

## Agent 智能体编排

> 输入对应提示词后保存即可

<img src="/ai/agent-list.png" width="1770">

> 创建后可在 AI 对话中智能体列表中看到

<img src="/ai/agent-select.png" width="764">

> 提示词动态处理器，实现 EruptPromptHandler 接口，在界面中选择即可

```java
@Component
public class TestPromptHandler implements EruptPromptHandler {
    @Override
    public String name() {
        return "提示词处理器";
    }

    @Override
    public String handle(String prompt) {
        return prompt + "，你是一个测试提示词处理器";
    }
}
```

<img src="/ai/agent-prompt.png" width="1770">

## 自定义 Tool 注入

:::info
通过 `@AiToolbox` + `@Tool` 将任意 Spring Bean 方法注册为 AI 工具，AI 在对话中可自动识别意图并调用，实现与当前系统的深度交互——查数据、触发业务、执行操作，一句话即可完成。
:::

**1.14.1 以下版本，详见：** https://www.yuque.com/erupts/1.13.x/qsk71q5zyy3segr6_gxxnld#jA3q1

**1.14.1 及以上版本：**

```java
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import xyz.erupt.ai.annotation.AiToolbox;

/**
 * 1. 添加类注解 @AiToolbox
 * 2. 需要暴漏的方法增加 @Tool 注解即可，参数可使用 @P 注解
 **/
@AiToolbox
@Component
public class TestTools {

    @Tool("快捷使用shell open命令，当用户输入网址或者文件路径时帮助用户快捷打开")
    public String call(@P("路径信息") String uri) {
        Runtime runtime = Runtime.getRuntime();
        try {
            runtime.exec("open " + uri);
            return "已打开: " + uri;
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @Tool("当前系统硬件信息")
    public String systemInfo() {
        try {
            Process process = Runtime.getRuntime().exec("system_profiler SPHardwareDataType");
            return String.join("\n",
                    new BufferedReader(new InputStreamReader(process.getInputStream()))
                            .lines().collect(Collectors.toList()));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}
```

<img src="/ai/tools-demo.png" width="760">

## 角色级 Tool 授权 <Badge type="tip" text="v1.14.3+" />

:::tip
AI 能力不再一刀切。通过为每个角色独立配置**系统提示词**与**工具权限**，让每位用户在登录后看到的是专属于其岗位的 AI——财务专员聊报表、运维工程师查日志、业务人员问数据，各得其所，互不越界。

管理员天然拥有全量工具权限，其余角色按需授权，让 Claw 具备在生产环境安全部署的能力。
:::

在角色管理界面中，为目标角色勾选可调用的 Tool，并填写专属系统提示词，保存即时生效：

<img src="/ai/ai-role.png" width="1270">

为每个 AI Tool 配置角色权限策略，不同角色可调用不同工具集，精细化管控 AI 能力边界与安全边界。每个角色可绑定独立的系统提示词，让不同岗位的用户看到专属于自己角色的 AI 助手。

| | 说明 |
|---|---|
| **管理员** | 天然拥有全量工具，无需额外配置 |
| **其他角色** | 按界面勾选授权，未勾选的工具对该角色完全屏蔽 |
| **系统提示词** | 每个角色可设置独立提示词，精准锚定该角色的业务上下文与回答风格 |

## 接入外部 MCP 生态

:::info
接入任何外部的 MCP，支持完整的 MCP 协议，可在 erupt 平台内操作任意 MCP，如控制浏览器、操作桌面文件等。
:::

<img src="/ai/mcp-config.png" width="1680">

<img src="/ai/mcp-list.png" width="1680">

调用示例：操控 Google 浏览器，并且与当前系统 Tool 配合使用：

<img src="/ai/mcp-browser.png" width="1861">

## 内置 MCP Server

:::tip
将系统的 AI Tools 对外暴露，提供其他工具的调用，例如：Cursor、Claude Code 等
:::

1. 在 `application.yml` 中开启 MCP 配置：

```yaml
erupt:
  ai:
    mcp:
      server-enabled: true
```

2. 在 Claude Code / Cursor / VS Code 中增加 MCP 配置：

<img src="/ai/mcp-server-config.png" width="1269">

```json
{
  "mcpServers": {
    "erupt": {
      "type": "sse",
      "url": "http://localhost:9999/mcp",
      "headers": {
        "Authorization": "Bearer {{your secret}}"
      }
    }
  }
}
```

Authorization 可进入 Open API 菜单生成，值对应"秘钥"列，请注意妥善保管切勿泄露。

<img src="/ai/openapi-key.png" width="1519">

3. 连接成功：

<img src="/ai/mcp-connected.png" width="656">

4. Cursor 交互效果演示：

<img src="/ai/cursor-1.png" width="293">

<img src="/ai/cursor-2.png" width="294">

<img src="/ai/cursor-3.png" width="431">

## 动态 System Prompt 注入

:::tip
支持**动态扩展**系统提示词，在用户发起提问时按需注入，精准控制 Token 消耗，同时提升回答的相关性与准确性。
:::

1. 实现 `SystemPromptProvider` 接口
2. 注册 `registerProvider`
3. 实现 `getPrompt` 方法体

```java
@Component
public class OrderAiPrompt implements SystemPromptProvider {

    @PostConstruct
    public void init() {
        SystemPromptProvider.registerProvider(this);
    }

    @Override
    public String getPrompt() {
        return """
                ## 订单助手
                当用户询问订单相关问题时，优先通过 queryOrder 工具查询数据后再作答，
                不要凭空捏造订单信息。金额单位为人民币元，时间格式为 yyyy-MM-dd HH:mm。
                """;
    }

}
```

## 多 Agent 协作（A2A） <Badge type="tip" text="v1.14.3+" />

兼容 [Google A2A 协议](https://google.github.io/A2A/)，可接入任意实现了 A2A 标准的 Agent 服务。进入菜单 **AI → A2A Agent**，填写远端 Agent 的根地址，系统自动从 `{url}/.well-known/agent.json` 拉取 AgentCard，列表中的 **Skills** 列会展示该 Agent 声明的所有能力，连接失败时显示错误原因。Headers 字段可附加鉴权头，格式为 JSON，例如 `{"Authorization": "Bearer xxx"}`。

AI 在对话中内置 A2A 调度逻辑：任务超出自身能力范围时自动发现并委派给合适的子 Agent，可自行处理的任务不会触发委派。系统每 60 秒自动刷新一次连接状态，无需手动重启。

## 跨会话记忆（Memory） <Badge type="tip" text="v1.14.3+" />

:::info
AI 具备持久化记忆能力，跨会话保留用户偏好与对话上下文，打造真正有记忆的个性化 AI 助手。不同用户的记忆相互隔离，管理员可在后台查看和管理所有用户的记忆条目。
:::

Memory 能力开箱即用，无需额外配置。AI 会在合适时机自动将关键信息写入记忆，并在后续对话中按需检索。

## agentPrompt 与 contextPrompt <Badge type="tip" text="v2.0.0+" />

`LlmRequest` 新增两个可选字段，用于在单次 LLM 调用时注入额外提示词，适合动态场景下的上下文感知。

| 字段 | 说明 |
|------|------|
| `agentPrompt` | 本次调用的 Agent 角色提示词，相当于临时覆盖 Agent 的 system prompt |
| `contextPrompt` | 本次调用的上下文补充说明，追加在对话上下文末尾（如当前页面数据摘要） |

这两个字段由前端或集成方在调用聊天 API 时传入，可实现页面级、字段级的 AI 感知。与 `@Erupt(prompt = "...")` 和 `@Edit(prompt = "...")` 配合使用，可让 AI 理解每个实体和字段的业务语义。

## 驱动 Erupt Claw 🦞

[🦞 Erupt AI Claw](/zh/modules/erupt-ai-claw)
