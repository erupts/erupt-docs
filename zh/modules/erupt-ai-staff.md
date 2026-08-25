# Erupt AI Staff 数字员工 <Badge type="tip" text="v2.1.0+" />

erupt-ai-staff 是 erupt-ai 的数字员工扩展模块。不止是聊天助手——AI 员工拥有**系统账户、职责人设与工作排班**：按 cron 定时执行任务，调用权限内的工具完成工作，
并把工作报告主动推送到钉钉、企业微信、飞书、Slack；同事也可以在 IM 中直接 @ 它提问。

:::info 仓库地址
[https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-staff](https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-staff)
:::

## 使用方法

1. 添加依赖（需配合 [erupt-ai](/zh/modules/erupt-ai) 使用）：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-staff</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. 启动后新增 **AI 员工**、**渠道集成** 菜单。

## 创建员工

| 字段 | 说明 |
|---|---|
| **员工账户** | 绑定一个系统用户（EruptUser），员工以该账户身份工作，其角色决定可调用的 AI 工具 |
| **模型** | 可选专属 LLM，留空则使用默认对话模型 |
| **职责** | Markdown 格式的职责与人设描述，每次执行时追加到系统提示词 |
| **状态** | 在岗 / 离岗 |

员工的能力边界完全由其绑定账户的角色权限决定，天然复用 erupt 的权限体系，可安全用于生产环境。

## 员工任务

在员工的 **任务** 下钻页面中创建工作单：

| 字段 | 说明 |
|---|---|
| **任务指令** | Markdown 格式的工作说明，告诉员工做什么 |
| **Cron 表达式** | 定时执行；留空则仅支持手动执行（行操作「立即执行」） |
| **汇报渠道** | 每次执行完成后，工作报告推送到指定渠道 |

每次执行都会留下 **工作日志**，可下钻查看完整的执行过程与结果。

## 渠道集成

进入 **渠道集成** 配置 IM 通道，内置四种渠道类型：**钉钉（DingTalk）**、**企业微信（WeCom）**、**飞书（Feishu）**、**Slack**。

- **出站推送**：员工任务的工作报告推送至该渠道
- **入站应答**：配置「应答员工」后，IM 中发给机器人的消息会路由给该员工回答；留空则该渠道仅用于推送
- **回调地址**：`{domain}/erupt-api/ai-staff/channel/{code}`，将其填入 IM 平台的机器人回调配置
- 界面内置 **测试连接** 与 **测试推送** 按钮，配置即时验证
