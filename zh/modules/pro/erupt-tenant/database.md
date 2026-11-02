# 数据库设计

模块自己只有租户与套餐几张表，租户的用户、角色、组织直接复用 erupt-upms 的表。启动时自动建表与初始化菜单，无需执行任何 SQL 脚本。

<img src="/tenant/er.png" width="900">

## 租户共享表（超管端维护）

| 表名 | 说明 |
| --- | --- |
| e_tenant_config | 租户配置：租户 ID、企业 ID（唯一）、租户名称、联系人、状态（启用 / 锁定）、到期时间（为空表示永不到期）、管理员账号、域名、logo、租户 CSS / JS |
| e_tenant_config_package | 租户与套餐的关联表 |
| e_tenant_package | 租户套餐：编码（唯一）、名称、排序、状态、试用天数 `trial_days`（新建租户未填到期时间时取已启用套餐中的最大值） |
| e_tenant_package_menu | 套餐与菜单的关联表，`menu_id` 指向平台菜单表 `e_upms_menu` |

:::info
2.4.0 起不再创建 `e_tenant_menu`（租户菜单）与 `t_e_upms_user`、`t_e_upms_user_role`、`t_e_upms_role`、`t_e_upms_role_menu`、`t_e_upms_org`（租户端用户 / 角色 / 组织）这些表。
:::

## 租户用户 / 角色 / 组织（复用 erupt-upms 表） <Badge type="tip" text="v2.4.0+" />

erupt-upms 的用户目录表带有 Hibernate `@TenantId` 列 `tenant_id`（平台行为 `'0'`，租户行为租户 ID），由 Hibernate 在查询时自动限定、插入时自动填充：

| 表名 | 说明 |
| --- | --- |
| e_upms_user | 用户：唯一约束 `uk_upms_user_account (tenant_id, account)`，同一账号可在不同租户下各存在一次；租户管理员为 `is_admin = true` 的用户 |
| e_upms_user_role / e_upms_user_org_head / e_upms_user_org_division | 用户的角色、负责组织、分管组织关联表，跟随用户所属租户 |
| e_upms_role | 角色：唯一约束 `uk_upms_role_code (tenant_id, code)`；租户角色可分配的菜单由 `TenantMenuScope` 限定在套餐内 |
| e_upms_role_menu | 角色与菜单的关联表，菜单来自平台 `e_upms_menu` |
| e_upms_org | 组织：树形结构，唯一约束 `uk_upms_org_code (tenant_id, code)` |
| e_upms_post | 岗位：唯一约束 `uk_upms_post_code (tenant_id, code)` |
| e_upms_login_log / e_upms_operate_log | 登录日志、操作日志同样带 `tenant_id`，租户只能看到自己的日志与在线用户 |

:::warning 从 2.3.x 升级
旧版本在这些表上建立的单列唯一索引（`account`、`code`）会阻止两个租户使用相同的账号或编码，2.4.0 不再在启动时自动删除，请按 [升级指南](/zh/guide/upgrade) 手工执行 SQL 删除。
:::

## 业务表

标注 `@EruptTenant` 或继承 `TenantBaseModel` 系列基类的业务表会自动携带租户字段（默认 `tenant_id`），由框架完成行级隔离。建议为租户字段创建索引：

```java
@Table(
    name = "t_tenant_demo",
    indexes = @Index(columnList = EruptTenant.TENANT_FIELD)
)
```

数据隔离行为详见 [多租户开发](/zh/modules/pro/erupt-tenant/development#数据隔离机制)。
