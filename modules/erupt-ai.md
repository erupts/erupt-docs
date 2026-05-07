# Erupt AI 大模型深度集成

与当下流行的大模型深度集成，低代码开发大模型应用。

支持主流大模型：ChatGPT、Grok、MinMax、DeepSeek、Claude、Gemini、Moonshot、GLM、Ollama 等

支持智能体、Function Call、MCP

## 使用方法

1. 添加依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. 配置项（可选）：

```yaml
erupt:
  ai:
    # 系统提示词
    system-prompt: 你是 Erupt AI，你更擅长中文和英文的对话。你会为用户提供安全，有帮助，准确的回答。
```

3. 启动后会增加 AI 相关菜单，包括：大模型管理、智能体管理、交互式对话等。

## 大模型管理

增加对应的大模型，对应的 key 到大模型官网中申请即可。

## 智能体管理

输入对应提示词后保存即可，调用方式：在输入框中输入 `@` 符号，即可选择已配置智能体。

### 提示词动态处理器

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

## MCP 支持

> 1.13.1 及以上版本支持

erupt-ai 支持 MCP（Model Context Protocol），可通过 Cursor 等工具交互访问 erupt 实体数据。MCP 能力增加鉴权控制及默认实现。
