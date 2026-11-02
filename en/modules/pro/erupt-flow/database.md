# Database Design

erupt-flow uses an independent table design — existing erupt business tables are unaffected.

| Table | Business Meaning | Responsibility |
| --- | --- | --- |
| e_flow | Flow definition | Stores all launchable "flow templates" — the core flow definitions |
| e_flow_group | Flow group | Categorizes flows for grouped display on the frontend |
| e_flow_instance | Flow instance | Each launched flow produces a runtime record: who, when, which template, current status |
| e_flow_instance_record | Instance node record | Snapshots of each node entry/exit at runtime, used for approval trace diagrams, auditing, and re-runs |
| e_flow_instance_approval_task | Approval task | Splits human-approval nodes into to-do tasks; supports multiple approvers, multiple rounds, countersign, and or-sign |
| e_flow_instance_comment | Approval comment | Stores comments on flow instances |
| e_flow_instance_form_history | Form history | Records every modification of form data while a flow is running |

ER diagram:

<img src="/flow/er.png" width="720">

## Tenant Column <Badge type="tip" text="v2.4.0+" />

`e_flow`, `e_flow_group` and `e_flow_instance` carry a Hibernate `@TenantId` column `tenant_id` (`varchar`, not null, `'0'` for platform rows and the [erupt-tenant](/en/modules/pro/erupt-tenant/) tenant ID for tenant rows). Hibernate restricts every query to the session's tenant and stamps it on insert, so flow definitions, groups and instances are listed per tenant by themselves; the child tables (node records, approval tasks, comments, form histories) carry no tenant column of their own and follow their instance.

User references in the flow tables (initiator, assignee, creator and so on) point to `e_upms_user` (entity `EruptUserVo`), where tenant users and platform users share one table — see [Multi-tenant support](/en/modules/pro/erupt-flow/development#multi-tenant-support).
