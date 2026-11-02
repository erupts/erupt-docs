---
title: "SessionScopeGuard × DataProxy × FilterHandler：公开链接不该是第二套认证"
description: 简道云、明道云、钉钉宜搭都有"公开表单"，通常是一条独立于登录体系的匿名通道。erupt-share 反过来做：打开链接就是以签发人名义铸一个普通会话，再用一个白名单把它收窄到一张表单。这一期讲清楚这样做的权衡。
outline: deep
---

# 第 26 期 · 公开链接不该是第二套认证

> 给陌生人一个能提交数据的链接，最容易写出来的方案是"开一条匿名接口"——于是后台里多了一套没人审计的权限路径。`erupt-share` 的做法相反：**链接不是新的身份，而是签发人身份的一次收窄**；陌生人拿到的是一个普通 erupt 会话，只是 403 守在它身边。
>
> _发布于 2026-11-02 · 阅读 ~9 min_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

报名表、问卷、工单提交页——后台系统迟早要把一张表单开给"没有账号的人"。国内平台的通行做法是一条独立的公开通道：

- **简道云 / 明道云**：表单可生成公开填写链接，并设置有效期、填写次数等限制；收集的数据落进应用自己的数据表。
- **钉钉宜搭**：表单可对外分享填写，数据进入同一应用的表单实例。

这些产品的内部实现我们没有看到，不做评论。我们能说的是自己的约束：Erupt 的权限体系是**菜单 + 按钮 + 数据范围**，已经被 `EruptSecurityInterceptor` 统一执行。再开一条匿名接口，意味着每个新端点都要问一遍"匿名能不能走到这里"。

所以 `erupt-share` 的命题是：

> **公开链接 = 一枚以签发人名义铸造的普通会话 + 一个只认白名单的守卫。**不新增认证体系，只新增一个"收窄"的钩子。

## 二、三种做法的分歧

| 做法 | 陌生人拿到的是 | 新增的攻击面 |
|---|---|---|
| 匿名接口（不带 `@EruptRouter` 的公开端点） | 没有身份 | 每个公开端点各自校验 |
| 访客账号（给陌生人建 `EruptUser`） | 一个低权限用户 | 账号泛滥，需要清理 |
| **收窄会话（erupt-share）** | 签发人的会话，但菜单只剩目标所需 | 一个守卫 + 一个路由白名单 |

第三种的关键在于：会话是真的会话，走的是同一个拦截器；"能做什么"由两层叠加决定——铸造时只授予目标所需的菜单，再由守卫逐请求检查路径。

## 三、一条链接上的可数事实

`EruptShareLink`（表 `e_share_link`）一行就是一条链接，字段全部是 `@EruptField`，管理界面由注解生成：

- 链接码 `code`：22 位随机字母数字（`CODE_LENGTH = 22`），是 URL 里唯一的秘密；
- 类型：`FORM`（任何人可提交的表单）或 `PAGE`（任何人可读的 tpl 页面）；
- 必填过期时间 `expireTime`；可选 `maxVisits`、可选密码、`enabled` 开关；
- 密码只存 SHA-512 加盐摘要，**盐就是链接码**，相同密码不会得到相同摘要；表单里的密码字段是 `@Transient`，摘要永远不会发回浏览器；
- `erupt.share` 配置三项：`session-minutes`（默认 120）、`max-attempts`（默认 20）、`attempt-window-minutes`（默认 10）。

签发和展示全是已有的扩展点，没有新概念：

```java
@Erupt(
        name = "Share Link",
        orderBy = "createTime desc",
        dataProxy = ShareLinkProxy.class,                     // DataProxy：发码、冻结签发人
        filter = @Filter(conditionHandler = ShareScopeFilter.class), // FilterHandler：只看自己的链接
        power = @Power(export = false, importable = false),
        rowOperation = @RowOperation(code = ShareCopyLinkOperation.CODE, title = "Copy Link",
                icon = "fa fa-link", mode = RowOperation.Mode.SINGLE,
                callHint = "", operationHandler = ShareCopyLinkOperation.class) // OperationHandler：复制完整 URL
)
@Entity
@Table(name = "e_share_link", indexes = @Index(columnList = "code", unique = true))
public class EruptShareLink extends HyperModelCreatorOnlyVo { /* ... */ }
```

模型选择 `ShareEruptChoice`、页面选择 `SharePageChoice` 是 `ChoiceFetchHandler`；"复制链接"按钮是 `OperationHandler`。整个模块用的全是 `xyz.erupt.annotation.fun.*` 里已有的接口。

## 四、签发：链接给的不能比签发人多

`ShareLinkProxy#beforeAdd` 在落库前做四件事：校验目标、生成链接码、冻结签发人身份（`issuerId` / `issuerAccount` / `issuerName` / `tenantId`）、把密码换成摘要。其中校验最有意思，在 `EruptShareService#verifyTarget`：

```java
// 表单链接：模型必须是本地的、允许新增，并且签发人自己同时持有它的菜单和"新增"按钮
public static boolean canAdd(EruptModel model, Map<String, Boolean> menuValues) {
    if (null == model || model.isRemote() || !model.getErupt().power().add()) return false;
    String name = model.getEruptName();
    return menuValues.containsKey(name.toLowerCase())
            && menuValues.containsKey(UPMSUtil.getEruptFunPermissionsCode(name, EruptFunPermissions.ADD).toLowerCase());
}
```

没有"新增"权限的人，连这条链接都建不出来（提示 `No permission to share this model`）；`PAGE` 类型同理，只能分享自己菜单里有的 tpl 页面。**链接的权限上限就是签发人的权限，不需要另一张授权表。**

## 五、打开：铸一枚会话，再把它收窄

访客的两次调用都不需要登录，所以 `EruptShareController` 里的 `GET /erupt-api/share/meta/{code}` 和 `POST /erupt-api/share/exchange/{code}` 都没有 `@EruptRouter`。`exchange` 的顺序值得逐步看：

1. 按客户端 IP 计失败次数，超过 `max-attempts` 直接拒绝；
2. 校验链接存在、已启用、未过期、次数未满、密码正确——任何一项失败都会让计数加一；
3. 用**一条 UPDATE 语句**加访问计数，`where` 里带 `visitCount < maxVisits`：两个访客抢最后一个名额，只有一个更新到行，不需要锁；
4. 铸会话：`issuerInfo` 以签发人的账号和租户登录，但 `setSuperAdmin(false)`、角色为空——**不论签发人是谁，访客永远不是管理员**；菜单由 `targetMenus` 手工拼成，表单只有"该 erupt 的表菜单 + 它的 ADD 按钮"；
5. 会话寿命取 `session-minutes` 与链接剩余时间的较小值；同时把 `ShareScope`（类型、erupt、path）按 token 存进会话存储；
6. 记一条登录日志，名字形如 `签发人 [share 码]`，审计里一眼可辨。

## 六、守卫：一个接口，一张路由白名单

拦截器只多了一个钩子。`xyz.erupt.security.scope.SessionScopeGuard` 只有一个方法：

```java
public interface SessionScopeGuard {
    boolean allow(String token, HttpServletRequest request, EruptRouter eruptRouter);
}
```

`EruptSecurityInterceptor` 在 token 验证、用户注册之后、菜单与 erupt 权限检查之前遍历所有守卫，任何一个返回 `false` 就是 403。普通登录会话没有 scope，所有守卫都放行；`erupt-cloud-server` 的拦截器验证 token 的方式不同，所以 `scopeAllows` 被做成了 public，两处共用同一套规则。

`ShareScopeGuard` 的实现是一张**显式列出的路由表**：`FORM_ROUTES` 里是表单自己会用到的 22 条路径——表单构建、新增、`init-value`、`onchange`、选项与引用字段的取数、文件上传——每条都带 `{erupt}` 占位，且要求它等于链接绑定的那个 erupt（或经请求头声明父表单、且已被拦截器验证为其子表单的 erupt）。其余一律不通：

- 没有表格查询、没有记录读取、没有更新、没有导出，也没有别的 erupt；
- `PAGE` 类型只允许 `path.equals(TPL + scope.getPath())`，一个字符不多。

:::tip 反直觉的小结
白名单不是"禁止危险端点"，而是"只允许表单自己要的端点"。新增一个端点时，默认对公开链接是 403——**新功能不会因为忘了写一行校验而悄悄公开。**
:::

撤销也沿用同一个机制：关闭 `enabled` 或删除链接时，`ShareLinkProxy#afterUpdate` / `beforeDelete` 调用 `revokeSessions`，按前缀扫出这条链接铸过的所有会话并注销。

## 七、跟简道云 / 明道云 / 宜搭怎么比？

我们没有逐项实测这些产品。左列是**选型时值得问的问题**，不是对它们的结论，以各自官方文档为准。

| 维度 | 国内对位：选型时该问 | Erupt |
|---|---|---|
| 公开填写的权限从哪来 | 简道云、明道云、宜搭：公开表单的权限与应用的角色体系是同一套吗？ | 签发人的权限为上限，`verifyTarget` 在创建时校验 |
| 访问限制 | 有效期、次数、密码能否同时设置、能否即时停用？ | `expireTime` 必填，`maxVisits`、密码、`enabled` 可选；停用即注销已发会话 |
| 暴力猜测 | 链接码和密码有没有按来源限速？ | 22 位随机码；按 IP 限速，默认 10 分钟 20 次 |
| 新端点是否默认公开 | 平台新增接口时，匿名通道是否需要重新审计？ | 默认 403，`FORM_ROUTES` 需显式加行 |
| 数据去向 | 提交的数据在哪张表？ | 就是目标 erupt 自己的表，`DataProxy` 钩子照常触发 |

## 八、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

`erupt-share` 是 `erupt-plugin` 下的可选模块，`erupt-spring-boot-starter-all` 已包含。单独引入时：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-share</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

它依赖 `erupt-upms` 与 `erupt-security`，无需额外配置；需要调整时用 `erupt.share.*` 三项。

## 九、代价与下一期预告

- **访客会话是签发人的会话。** 它没有角色、不是管理员，菜单也被收窄，但数据写入时的创建人是签发人。要区分"谁提交的"，需要在表单里自己加字段。
- **守卫只在链接会话里生效。** 普通登录会话不受影响，这是设计，不是漏洞。
- **会话有存活时间。** 默认最长 120 分钟，且不会超过链接的剩余有效期。
- **不支持远程模型。** `model.isRemote()` 的 erupt 无法创建分享链接。

下一期回到数据层：主仓 #447 给列表加了「批量修改」——选中若干行，对同一个字段一次写入同一个值。直觉上这是一条 `UPDATE ... WHERE id IN (...)`，源码里它**每一行都走一遍已有的单元格编辑管线**：校验、行级权限、`DataProxy` 钩子、操作日志，任何一行被拒整批回滚。**批量操作为什么不该绕过管线**，下期细说。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-share/.../model/EruptShareLink.java`、`handler/ShareLinkProxy.java`、`service/EruptShareService.java`、`service/ShareScopeGuard.java`、`controller/EruptShareController.java`，以及 `erupt-security/.../scope/SessionScopeGuard.java`、`interceptor/EruptSecurityInterceptor.java`。

公开链接的白名单还应该再收多紧，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
