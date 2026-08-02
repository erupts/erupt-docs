# 数据库设计

独立的表结构设计，不影响现有 erupt 业务表，启动时自动建表与初始化菜单，无需执行任何 SQL 脚本。

<img src="/tenant/er.png" width="900">

## 租户共享表（超管端维护）

| 表名 | 说明 |
| --- | --- |
| e_tenant_config | 租户配置：企业 ID（唯一）、租户名称、联系人、状态、到期时间、管理员账号、域名、logo、租户 CSS / JS |
| e_tenant_config_package | 租户与套餐的关联表 |
| e_tenant_menu | 租户菜单：树形结构，菜单编码唯一，启动时自动初始化并按 erupt 类权限生成按钮级菜单 |
| e_tenant_package | 租户套餐：定义一组菜单能力，按套餐授权给租户 |
| e_tenant_package_menu | 套餐与菜单的关联表 |

## 租户内业务表（按 tenant_id 行级隔离）

| 表名 | 说明 |
| --- | --- |
| t_e_upms_user | 租户用户：唯一约束 `tenant_id + account`，支持密码加密（默认 MD5 + 盐）、IP 白名单、账号有效期、租户管理员标记 |
| t_e_upms_user_role | 用户与角色的关联表 |
| t_e_upms_role | 租户角色：唯一约束 `tenant_id + code`，菜单权限仅可选择该租户已开通套餐内的菜单 |
| t_e_upms_role_menu | 角色与菜单的关联表 |
| t_e_upms_org | 租户组织：树形结构，唯一约束 `tenant_id + code` |

## 业务表

标注 `@EruptTenant` 或继承 `TenantBaseModel` 系列基类的业务表会自动携带租户字段（默认 `tenant_id`），由框架完成行级隔离。建议为租户字段创建索引：

```java
@Table(
    name = "t_tenant_demo",
    indexes = @Index(columnList = EruptTenant.TENANT_FIELD)
)
```

数据隔离行为详见 [多租户开发](/zh/modules/pro/erupt-tenant/development#数据隔离机制)。
