# Erupt AI Staff <Badge type="tip" text="v2.1.0+" />

erupt-ai-staff is the digital-staff extension of erupt-ai. More than a chat assistant — AI staff have a **system account, duty persona, and work schedule**: they run tasks on cron schedules, use the tools within their permissions to get work done, and proactively push work reports to DingTalk, WeCom, Feishu, or Slack. Colleagues can also @ them directly in IM to ask questions.

:::info Repository
[https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-staff](https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-staff)
:::

## Getting Started

1. Add the dependency (requires [erupt-ai](/en/modules/erupt-ai)):

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-staff</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. After startup, the **AI Staff** and **Channel Integration** menus are added.

## Creating Staff

| Field | Description |
|---|---|
| **Staff Account** | Binds a system user (EruptUser); the staff works under this account, whose roles decide which AI tools are allowed |
| **Model** | Optional dedicated LLM; leave blank to use the default chat model |
| **Duty** | Responsibilities and persona in Markdown, appended to the system prompt on every run |
| **Status** | On Duty / Off Duty |

A staff member's capability boundary is entirely determined by the role permissions of its bound account — naturally reusing erupt's permission system and safe for production use.

## Staff Tasks

Create work orders in the staff member's **Tasks** drill-down page:

| Field | Description |
|---|---|
| **Task Instruction** | Work description in Markdown telling the staff what to do |
| **Cron Expression** | Scheduled execution; leave blank for manual-only runs (via the "Execute Now" row operation) |
| **Report To** | Channel the work report is pushed to after each run |

Every run leaves a **Work Log** that can be drilled into to view the full execution process and results.

## Channel Integration

Go to **Channel Integration** to configure IM channels. Four channel types are built in: **DingTalk**, **WeCom**, **Feishu**, and **Slack**.

- **Outbound push**: work reports from staff tasks are pushed to the channel
- **Inbound answering**: with an "Answering Staff" configured, messages sent to the bot in IM are routed to that staff member; leave blank for push-only
- **Callback URL**: `{domain}/erupt-api/ai-staff/channel/{code}` — fill this into the IM platform's bot callback configuration
- Built-in **Test Connect** and **Test Push** buttons verify the configuration instantly
