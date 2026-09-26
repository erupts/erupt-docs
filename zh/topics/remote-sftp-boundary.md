---
title: "远程主机的安全边界"
description: 浏览器里开一个 SSH 终端，行业只有两条路——上堡垒机（另起一套账号体系），或者装面板（装上即 root）。Erupt 押第三条：远程主机就是一个普通的 @Erupt 模型，走同一套菜单权限、同一套 DataProxy。代价是边界要一条条自己画。这一期把那几条线逐条列出来。
outline: deep
---

# 第 12 期 · 远程主机的安全边界

> 上一期结尾我们说，这一期讲 `erupt-remote` 新加的 SFTP 文件面板。但"能传文件了"本身不值得写一篇——jsch 调一下 `ChannelSftp.put()` 就完了。
> 值得写的是另一件事：**一个后台框架决定让用户在浏览器里碰生产机的那一刻，它就欠了一份边界清单。** 这一期把 erupt-remote 的那份清单逐条摊开——哪些地方我们写了拒绝，哪些地方我们明确选择了不做。
>
> _发布于 2026-09-18 · 阅读 ~11 min_

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

"运维同学要看一眼服务器日志，但他没有跳板机账号" —— 这是 erupt-remote 最初的需求。

在国内，这件事有两条成熟的路，且泾渭分明：

- **JumpServer**（开源堡垒机）：把远程访问做成一套独立系统。独立的资产台账、独立的用户与授权模型、独立的会话审计与录像、独立的代理进程。安全边界很清楚，因为整套东西就是为画这条边界而存在的。代价是你要多运维一套系统，以及多维护一份跟业务系统对不上的账号表。
- **1Panel** / **宝塔面板**：把远程访问做成一个功能。装上面板，面板进程本身就以 root 跑在机器上，终端只是它顺手提供的一个 tab。边界几乎不存在——**能登面板 ≈ 能干任何事**。
- **JeecgBoot** / **若依 RuoYi** / **JNPF** 这类后台框架：干脆没有这一层。要连服务器，请开 Xshell。

erupt-remote 押的是第三条路，而它的赌注是一句听起来有点无聊的话：

> **远程主机不配拥有自己的权限体系。它就是一个普通的 `@Erupt` 模型，走框架已有的菜单权限、`DataProxy`、行级过滤。**

这句话的好处是显然的：没有第二套账号表，没有第二个要同步的组织架构，运维同学在 UPMS 里被停用，他到主机的路同一秒就断了。

这句话的代价也是显然的：**框架不会自动帮你画安全边界，每一条都得自己在业务代码里写出来。** 这一期就是那几条线。

## 二、三种做法：另起一套 / 不设边界 / 复用已有

| 维度 | 堡垒机（JumpServer） | 面板（1Panel / 宝塔） | 模型即主机（erupt-remote） |
|---|---|---|---|
| 账号体系 | 独立一套，需与业务系统同步 | 面板自己一套，常共用一个管理员 | **无新增**，就是 `EruptUser` |
| 用户停用后 | 等下次同步 | 面板账号另算 | **同一秒失效**，同一张用户表 |
| 谁能连哪台 | 资产授权矩阵 | 能登面板即全机器 | 主机行上的 `authUsers` |
| 凭据落库 | 独立 Vault | 面板配置文件 | AES-GCM，见 §五 |
| 额外进程 | 需要部署代理 | 面板常驻 root | **0**，走应用自己的 WebSocket |
| 会话录像审计 | 有 | 基本没有 | **没有**，这是明确取舍，见 §六 |
| 文件传输开关 | 资产策略里配 | 默认全开 | 主机行上的 `fileTransfer` 布尔字段 |

三列对应三种成本结构。选第三列的人，买的是"不再多维护一套系统"，卖的是"审计深度"。这笔交易对一个二十人的技术团队划算，对一家需要过等保三级的金融机构不划算——我们把这句话写在这里，而不是藏在 FAQ 里。

## 三、20 个类、6 条路由、4 道关

先给可数的事实。整个模块在 `erupt-plugin/erupt-remote/`：

- **20 个 Java 类**（`src/main/java`），其中安全相关的 5 个：`RemoteHostAccess`、`RemoteTicketService`、`RemoteCrypto`、`TofuHostKeyRepository`、`SftpPaths`
- **1 张主表** `e_remote_host` + **1 张关联表** `e_remote_host_user`
- **6 条 SFTP 路由**，全部挂在 `/erupt-api/remote/sftp/**`
- **每条路由 4 道校验**，一道不过就返回错误
- **4 个配置项**，前缀 `erupt.remote`

六条路由（`RemoteSftpController`）：

| 方法 | 路径 | 作用 |
|---|---|---|
| GET | `/{id}/home` | 登录用户的家目录绝对路径 |
| GET | `/{id}/ls?path=` | 列目录 |
| GET | `/{id}/download?path=` | 流式下载单个文件 |
| POST | `/{id}/upload?path=&name=` | 请求体即文件字节 |
| POST | `/{id}/mkdir?path=&name=` | 新建目录 |
| DELETE | `/{id}?path=` | 删一个文件，或一个**空**目录 |

最后一行是第一条边界：**`delete` 永不递归**。

```java
/**
 * Removes one file or one <em>empty</em> directory. Never recursive: clearing a tree is a shell job, where
 * the user sees what they are typing.
 */
public void delete(RemoteHost host, String path) {
    String target = normalize(path);
    if ("/".equals(target)) throw new EruptWebApiRuntimeException(I18nTranslate.$translate("remote.sftp_bad_path"));
    run(host, sftp -> {
        if (sftp.stat(target).isDir()) {
            sftp.rmdir(target);
        } else {
            sftp.rm(target);
        }
        return null;
    });
}
```

递归删目录当然做得出来。不做的理由是：文件面板里一次误点，和终端里敲一遍 `rm -rf`，付出的注意力不是一个量级。**想清空一棵树，请到终端里去，那里你看得见自己在打什么字。** 同一个页面的左右两半，我们给了它们不同的危险等级。

## 四、SFTP 没有新开一条授权路径

新功能最容易出事的地方，是它顺手开了一条绕过老规则的新路。

SFTP 面板和 SSH 终端在同一个页面上，终端走 WebSocket，文件面板走 REST。两条协议、两套入口——这正是"文件面板能读到终端读不到的东西"最容易发生的地方。

`RemoteSftpController` 的做法是：把校验收进一个私有方法，六条路由的第一行全都调它。

```java
private RemoteHost host(Long id) {
    RemoteHost host = eruptDao.find(RemoteHost.class, id);
    Erupts.requireNonNull(host, I18nTranslate.$translate("remote.host_not_found"));
    Erupts.requireTrue(Boolean.TRUE.equals(host.getEnabled()), I18nTranslate.$translate("remote.host_disabled"));
    Erupts.requireTrue(remoteHostAccess.canOpen(host.getId()), I18nTranslate.$translate("remote.not_authorized"));
    Erupts.requireTrue(RemoteHost.PROTOCOL_SSH.equals(host.getProtocol()) && Boolean.TRUE.equals(host.getFileTransfer()),
            I18nTranslate.$translate("remote.sftp_disabled"));
    return host;
}
```

四道关：主机在、没被停用、当前用户被授权、协议是 SSH 且这台主机开了文件传输。再叠上方法注解 `@EruptMenuAuth(RemoteHost.MENU_VALUE)`——菜单权限和行级授权是两件事，两件都要。

关键是**每次调用都重来一遍**，不是开面板时查一次。页面开着的时候管理员把主机停用、把文件传输关掉、把这个人从 `authUsers` 里移走，用户的下一次点击就被拒。

路径参数交给一个不碰网络的纯函数：

```java
public static String normalize(String path) {
    if (path == null || path.isEmpty()) return "/";
    if (path.indexOf('\0') >= 0 || !path.startsWith("/")) throw new IllegalArgumentException("path");
    Deque<String> parts = new ArrayDeque<>();
    for (String seg : path.split("/")) {
        if (seg.isEmpty() || ".".equals(seg)) continue;
        if ("..".equals(seg)) {
            parts.pollLast();
        } else {
            parts.addLast(seg);
        }
    }
    return parts.isEmpty() ? "/" : "/" + String.join("/", parts);
}
```

`SftpPaths` 整个类 44 行，没有任何依赖，因此有一个 `SftpPathsTest` 直接对它做单元测试。上传时的文件名走另一个函数 `fileName()`：不含 `/`、不含 `\`、不含 `\0`、不是 `.` 也不是 `..`——**一个纯粹的文件名，永远落在用户当前所在的那个目录里**。

至于远端权限，我们一个字节也不管：连上去的是这台主机配置的 SSH 登录用户，它在 shell 里能读什么，在文件面板里就能读什么。**不做二次授权，也就不会做出一个和 shell 说法不一致的第二套答案。**

## 五、`authUsers`：过滤列表不等于授权

这是整个模块我最想讲的一处。

`RemoteHost` 上有一个再普通不过的多对多字段：

```java
@ManyToMany
@JoinTable(name = "e_remote_host_user",
        joinColumns = @JoinColumn(name = "host_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"))
@EruptField(
        edit = @Edit(title = "Authorized Users", type = EditType.TAB_TABLE_REFER,
                desc = "Users allowed to see and open this host. Nobody else sees it, whatever their role grants")
)
private Set<EruptUserByRoleView> authUsers;
```

语义是：**菜单权限决定一个人能不能碰远程主机这件事，`authUsers` 决定他能碰哪几台。没有被点名的人看不到这台主机，无论他的角色给了他什么。一台谁都没点名的主机，只有超管能开。**

天真的实现是在列表查询里加一个过滤条件就收工。`erupt-remote` 没有这么做：

```java
// 列表：查询片段，超管返回 null 表示不过滤
public String rowFilter(String alias) {
    MetaUserinfo user = eruptUserService.getSimpleUserInfo();
    if (null == user) return alias + ".id is null";
    if (user.isSuperAdmin()) return null;
    Long uid = user.getId();
    return alias + ".id in (select ah.id from RemoteHost ah join ah.authUsers au where au.id = "
            + (null == uid ? -1L : uid) + ")";
}

// 开连接：不看列表，直接问关联表
public boolean canOpen(Long hostId) {
    MetaUserinfo user = eruptUserService.getSimpleUserInfo();
    if (null == user) return false;
    if (user.isSuperAdmin()) return true;
    List<Long> authorized = eruptDao.getEntityManager()
            .createQuery("select u.id from RemoteHost h join h.authUsers u where h.id = :id", Long.class)
            .setParameter("id", hostId).getResultList();
    return authorized.contains(user.getId());
}
```

`rowFilter` 由 `RemoteHostDataProxy.beforeFetch` 接进列表查询，`canOpen` 由 ticket 端点和 SFTP 的每条路由各自调用。

:::tip 一条值得贴在墙上的结论
**把一个资源从列表里过滤掉，不等于保护了它——它只是被挪到了"猜一个 id"的距离之外。**
`RemoteHostAccess` 的类注释把这句话写死在源码里：_"Both the table and the ticket endpoint ask here: filtering the list alone would leave the host one guessed id away."_ 列表过滤是体验，端点校验才是授权。两个地方问的是同一个方法，答案不会分叉。
:::

注意 `null == user` 时返回的是 `alias + ".id is null"` 而不是 `null`。这两者的差别是"什么都查不到"和"什么都查得到"——**在一个安全相关的分支里，失败的方向必须是关门。**

凭据这一侧同样是"不给浏览器"：`RemoteHostDataProxy` 在 `beforeAdd` / `beforeUpdate` 里把密码和私钥用 AES-GCM 加密后落库（`RemoteCrypto`，IV 12 字节，认证标签 128 位，密文带 `enc:` 前缀以便和历史明文区分）；在 `editBehavior` / `formViewBehavior` 里把私钥换成掩码占位符再下发。更新时占位符原样回传，就从 `OldEntityTL` 里取回旧值——**改一次主机备注，不需要重贴一遍私钥。**

主机公钥走 TOFU（trust on first use）：`TofuHostKeyRepository` 第一次连接记下主机公钥并放行，之后公钥变了就**拒绝连接**并打一条 warn 日志。这是 `ssh` 命令行的默认行为，我们没有发明新的。

## 六、跟 JumpServer / 1Panel / 宝塔怎么比

| 维度 | JumpServer | 1Panel / 宝塔 | erupt-remote |
|---|---|---|---|
| 部署成本 | 独立系统 + 代理组件 | 目标机上装 agent/面板 | **一个 Maven 依赖** |
| 目标机要装什么 | 通常要 | 必须装 | **什么都不装**，标准 SSH / VNC |
| 授权粒度 | 资产 / 账号 / 命令级 | 基本没有 | 主机 × 用户（`authUsers`） |
| 文件传输开关 | 资产策略 | 默认全开 | 每台主机一个布尔字段 |
| 会话录像 | ✅ 完整 | ❌ | ❌ **不做** |
| 命令级黑白名单 | ✅ | ❌ | ❌ **不做** |
| 凭据加密 | 独立 Vault | 明文配置居多 | AES-GCM + 密钥文件/配置项 |
| WebSocket 会话授权 | 内部票据 | Session | 一次性 ticket，60 秒 TTL |

两个"不做"要说清楚，因为它们决定了这个模块适合谁：

**不做会话录像。** 做录像意味着要把终端字节流落盘、要管存储配额与保留期、要做回放播放器——这是一整个产品，不是一个插件。需要录像和命令审计的场景，请用堡垒机，erupt-remote 不打算和 JumpServer 抢这个位置。

**不做命令黑白名单。** 因为它给人一种虚假的安全感：`rm -rf /` 拦得住，`python -c` 拦不住。我们宁可把话说白——**能开终端的人，在那台机器上就有那个 SSH 用户的全部能力**，所以 `authUsers` 该点谁名，请当成发一把钥匙来对待。

至于 WebSocket 那条路，用的是一次性 ticket：`RemoteTicketService` 发一个 32 字节 `SecureRandom` 串，绑定到请求它的登录 token，TTL 60 秒，`consume()` 不论校验是否通过都先 `remove` 掉。理由很实际——WebSocket 握手不方便带自定义请求头，于是凭据会落到 URL 里；那就让落进 URL 的东西**只活一分钟、只能用一次、且换个人拿去也没用**。

## 七、5 分钟上手

从一个空 Spring Boot 项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

跑通之后，加这一个依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-remote</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

单机部署可以什么都不配——`RemoteCrypto` 会在 `.erupt/remote.key` 生成一把随机密钥并设为 `rw-------`。**多节点部署必须显式指定同一把密钥**，否则 A 节点存的凭据 B 节点解不开：

```yaml
erupt:
  remote:
    secret-key: ${ERUPT_REMOTE_KEY}   # 多节点必须一致，建议走环境变量
    max-sessions: 20                  # 全应用并发桌面会话上限
    idle-timeout-minutes: 30          # 无输入多久后断开
    connect-timeout-seconds: 5        # TCP 连接超时
```

重启后菜单里出现 **远程主机**。新增一台 SSH 主机、在 **授权用户** 里点名、把 **文件传输** 打开，行操作里的 **连接** 就能开出一个带文件面板的终端。模块完整说明见 [erupt-remote 模块文档](/zh/modules/erupt-remote)。

## 八、下一期预告

第 13 期回到写代码这件事本身，讲 `erupt-generator` 新长出来的 **从数据库反向读模型**。

有意思的不是"能读库了"——国内哪个框架没有代码生成器。有意思的是它读的东西：`DatabaseMetaData` 里的外键被读成 `@ReferenceTableType`，唯一索引被读成 `unique`，而**列注释里那句 `状态 0-禁用 1-启用`，被一个 19 行的正则解析成了一整个 `@ChoiceType`**。

我们的命题是：**你的数据库里已经写好了一半的 UI，只是过去二十年没有一个生成器认真去读它。** 顺带还有一个更不合群的决定——这个生成器不往你的源码目录里写任何文件。

---

:::info 参与讨论
本期专题对应的核心源码在 [`erupt-plugin/erupt-remote`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-remote)，授权逻辑集中在 [`xyz.erupt.remote.service.RemoteHostAccess`](https://github.com/erupts/erupt/blob/master/erupt-plugin/erupt-remote/src/main/java/xyz/erupt/remote/service/RemoteHostAccess.java)，路径规则在 [`xyz.erupt.remote.util.SftpPaths`](https://github.com/erupts/erupt/blob/master/erupt-plugin/erupt-remote/src/main/java/xyz/erupt/remote/util/SftpPaths.java)。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
