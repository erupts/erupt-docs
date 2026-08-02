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
