# 数据库设计

erupt-tenant 自己只有租户与套餐四张表；租户的用户、角色、组织等直接使用 erupt-upms 的表，以 `tenant_id` 列区分。启动时自动建表，不需要执行 SQL 脚本。

<img src="/tenant/er.svg" width="900" alt="erupt-tenant 数据库设计">

## 租户与套餐（超管维护）

这四张表只在超管端维护，不带租户列。

| 表 | 主要字段 |
| --- | --- |
| `e_tenant_config` | `tenant_id` 租户标识（创建时生成，`ex` + 14 位随机字符）· `code` 企业 ID（唯一）· `name` · `contact` · `status` 启用 / 锁定 · `expire_date` 到期时间（空 = 永不到期）· `account` 管理员账号 · `domain` · `logo` · `css` · `js` · `remark` · 创建 / 更新信息 |
| `e_tenant_config_package` | 租户与套餐的关联：`tenant_id` → `e_tenant_config.id`，`package_id` → `e_tenant_package.id` |
| `e_tenant_package` | `code`（唯一）· `name` · `sort` · `status` · `trial_days` 试用天数 · `remark` |
| `e_tenant_package_menu` | 套餐与菜单的关联：`role_id` → `e_tenant_package.id`，`menu_id` → `e_upms_menu.id` |

`e_tenant_config.tenant_id` 就是写入其他表 `tenant_id` 列的值。

## 用户目录（erupt-upms，按租户隔离）

带租户列 `tenant_id`，平台行为 `'0'`，租户行为租户标识；查询自动限定、新增自动填充。

| 表 | 唯一约束 |
| --- | --- |
| `e_upms_user` | `(tenant_id, account)` |
| `e_upms_role` | `(tenant_id, code)` |
| `e_upms_org` | `(tenant_id, code)` |
| `e_upms_post` | `(tenant_id, code)` |
| `e_upms_user_role` · `e_upms_user_org_head` · `e_upms_user_org_division` · `e_upms_role_menu` | 关联表，跟随所属用户 / 角色 |
| `e_upms_login_log` · `e_upms_operate_log` | 登录日志、操作日志 |
| `e_upms_sso` · `e_upms_sso_bind` | SSO 认证源（`(tenant_id, code)` 唯一）与账号绑定 |

完整说明见 [UPMS 多租户](/zh/modules/pro/erupt-tenant/upms)。

## 平台共享

| 表 | 说明 |
| --- | --- |
| `e_upms_menu` | 菜单只有一份，套餐与角色都引用它 |
| `e_dict` · `e_dict_item` · `e_open_api` | 数据字典、开放 API |

## 业务表

继承 `TenantBaseModel` 系列或标注 `@EruptTenant` 的业务表带租户字段（默认 `tenant_id`），租户行为租户标识，平台行为 `NULL`，由 erupt 数据代理完成隔离。建议为租户字段建索引：

```java
@Table(name = "t_student", indexes = @Index(columnList = EruptTenant.TENANT_FIELD))
```

隔离行为见 [业务表多租户](/zh/modules/pro/erupt-tenant/development#数据隔离机制)。

## 从 2.3.x 升级

- `e_tenant_menu` 与 `t_e_upms_user` / `t_e_upms_user_role` / `t_e_upms_role` / `t_e_upms_role_menu` / `t_e_upms_org` 不再使用，租户用户数据需迁入 `e_upms_*` 表
- 旧版本在 `account` / `code` 上的单列唯一索引需要手工删除，否则不同租户不能使用相同的账号或编码

具体步骤与 SQL 见 [升级指南](/zh/guide/upgrade)。
