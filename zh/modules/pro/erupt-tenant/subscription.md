# 套餐与订阅

## 套餐

套餐决定租户能用哪些功能。在「租户套餐」中新建套餐，从平台「菜单管理」里勾选菜单，再在「租户配置」中把套餐分配给租户（一个租户可以有多个套餐）。

<img src="/tenant/tenant-package.png" width="900">

| 字段 | 说明 |
| --- | --- |
| 编码 | 全局唯一 |
| 名称 / 排序 | 显示用 |
| 状态 | 停用的套餐不再授予菜单，也不参与试用天数计算 |
| 试用天数 | 新租户未填写到期时间时，取其已启用套餐中最长的试用天数作为到期日 |
| 菜单权限 | 引用平台菜单表 `e_upms_menu` |

租户全部会话（包括租户管理员）只能看到已启用套餐内的菜单，租户的角色编辑器也只能从这些菜单中分配权限。菜单只在「菜单管理」维护一份，修改套餐后对所有使用该套餐的租户生效。

## 订阅

租户的订阅只有一个日期：**到期时间** `expireDate`，为空表示永不到期。

### 试用

新建租户时如果没有填写到期时间，取其已启用套餐中最长的试用天数，从创建时起算；套餐都没有设置试用天数则不设到期。

### 状态

状态由到期时间与宽限天数在每次读取时推导，不落库：

| 状态 | 条件 | 能否使用 |
| --- | --- | --- |
| `Active` 生效 | 未到期，或没有到期时间 | ✅ |
| `Grace` 宽限 | 已过到期时间，仍在 `grace-days` 内 | ✅ |
| `Expired` 过期 | 超过宽限期 | ❌ 拒绝登录 |

租户配置中的 **状态** 开关（启用 / 锁定）独立于到期时间：锁定后无论是否到期都拒绝登录。

### 在线会话

租户在用户已登录时过期或被锁定，其会话会在下一次请求时被注销并返回 `401`，前端回到租户登录页并显示原因。为避免每个请求都读库，状态会缓存 `status-cache-seconds` 秒；超管端修改租户后缓存立即失效。

### 配置

```yaml
erupt:
  tenant:
    subscription:
      grace-days: 7            # 到期后的宽限天数，默认 0
      status-cache-seconds: 30 # 订阅状态缓存秒数，默认 30
```

### 续期

erupt 不负责收费。在你自己的支付逻辑收款成功后调用 `TenantSubscriptionService#extend` 延长到期时间：

```java
@Resource
private TenantSubscriptionService tenantSubscriptionService;

public void onPaid(Long tenantConfigId) {
    // 从原到期时间顺延；已经过期则从当前时间起算
    tenantSubscriptionService.extend(tenantConfigId, Period.ofYears(1), LocalDateTime.now());
}
```

### 查询订阅

租户会话可通过 `GET /erupt-api/tenant/info` 获取自己的租户 ID、名称、订阅状态、到期时间与已启用套餐，用于在前端提示续费。
