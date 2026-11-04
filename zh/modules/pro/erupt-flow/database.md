# 数据库设计

erupt-flow 表结构独立设计，不影响现有 erupt 业务表。

| 表名 | 业务含义 | 职责 |
| --- | --- | --- |
| e_flow | 流程定义表 | 保存所有可发起的"流程模板"，流程的核心定义 |
| e_flow_group | 流程分组表 | 给流程打分类标签，方便前端按分组展示 |
| e_flow_instance | 流程实例表 | 每一次"发起流程"都会在这里产生一条运行期数据，记录谁、何时、跑哪个模板、当前状态 |
| e_flow_instance_record | 实例节点记录表 | 记录实例在运行时每个节点的进出快照，用于画审批轨迹图、审计、重跑 |
| e_flow_instance_approval_task | 审批任务表 | 把"需要人点按钮"的节点拆成待办任务，支持多人、多轮、会签、或签 |
| e_flow_instance_comment | 审批意见表 | 存储流程实例的评论信息 |
| e_flow_instance_form_history | 表单历史表 | 流程运行中表单数据每次被修改的记录 |

ER 图：

<img src="/flow/er.png" width="720">

## 租户字段 <Badge type="tip" text="v2.4.0+" />

`e_flow`、`e_flow_group`、`e_flow_instance` 三张表带有 Hibernate `@TenantId` 列 `tenant_id`（`varchar`，非空，平台行为 `'0'`，租户行为 [erupt-tenant](/zh/modules/pro/erupt-tenant/) 的租户 ID）。查询时 Hibernate 自动限定到当前会话的租户、插入时自动填充，因此流程定义、流程分组与流程实例天然按租户分列；节点记录、审批任务、意见、表单历史等子表不单独带租户列，跟随其所属实例。

流程表中对用户的引用（发起人、审批人、创建人等）指向 `e_upms_user`（实体 `EruptUserVo`），租户用户与平台用户同在这张表中，详见 [多租户开发](/zh/modules/pro/erupt-flow/development#多租户支持)。
