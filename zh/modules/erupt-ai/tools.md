# 开发自定义 Tool

Tool 是 AI 与业务系统交互的桥梁：任何 Spring Bean 方法都能注册为工具，AI 在对话中按意图自动调用——查数据、触发业务、执行操作，一句话即可完成。

工具的可见范围由角色控制，见 [按角色授权 Tool](/zh/modules/erupt-ai/tool-auth)。

## 注册方式

:::info
通过 `@AiToolbox` + `@Tool` 将任意 Spring Bean 方法注册为 AI 工具，AI 在对话中可自动识别意图并调用，实现与当前系统的深度交互。
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
