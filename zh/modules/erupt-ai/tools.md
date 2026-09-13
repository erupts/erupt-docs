# 工具与角色授权

Tool 是 AI 与业务系统交互的桥梁：任何 Spring Bean 方法都能注册为工具，AI 在对话中按意图自动调用；再通过角色级授权，为不同岗位划定各自的工具边界。

## 自定义 Tool 注入

:::info
通过 `@AiToolbox` + `@Tool` 将任意 Spring Bean 方法注册为 AI 工具，AI 在对话中可自动识别意图并调用，实现与当前系统的深度交互——查数据、触发业务、执行操作，一句话即可完成。
:::

**1.14.1 以下版本，详见：** https://www.yuque.com/erupts/1.13.x/qsk71q5zyy3segr6_gxxnld#jA3q1

**1.14.1 及以上版本：**

```java
import dev.langchain4j.agent.tool.P;
import dev.langchain4j.agent.tool.Tool;
import xyz.erupt.annotation.ai.AiToolbox;

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

