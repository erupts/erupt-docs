# Authorize Tools by Role <Badge type="tip" text="v1.14.3+" />

AI capability is not all-or-nothing: give each role its own **tool permissions** and **system prompt**, and every user signs in to an AI shaped for their job — finance talks reports, ops reads logs, sales asks about data, none of them stepping outside their lane.

For how tools are written, see [Build Custom Tools](/en/modules/erupt-ai/tools).

## How to configure

In Role Management, tick the tools a role may call and write its system prompt; saving takes effect immediately:

<img src="/ai/ai-role.png" width="1270">

| | Notes |
|---|---|
| **Administrators** | Hold every tool by nature, nothing to configure |
| **Other roles** | Authorized by ticking boxes; an unticked tool is entirely hidden from that role |
| **System prompt** | Each role can carry its own prompt, anchoring the business context and tone for that position |

:::tip Why it matters
An unauthorized tool is invisible to the role — the AI neither mentions it nor can call it. That is what makes [erupt-ai-claw](/en/modules/erupt-ai-claw/) safe to deploy in production.
:::
