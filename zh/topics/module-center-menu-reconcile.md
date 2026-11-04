---
title: "EruptModule × MenuSeeder × ModuleGroup：模块开关不是卸载，是一列状态"
description: 国内低代码平台的"应用中心 / 插件市场"多半是一套独立的安装卸载机制。Erupt 的模块中心反过来：关掉一个模块，只是把它独有的菜单置为禁用并记在一列里。这一期讲清楚菜单对账的三方合并、"禁用而非隐藏"和这样做的代价。
outline: deep
---

# 第 27 期 · 模块开关不是卸载

> 一个后台装上 46 个模块后，新人面对的是一排看不懂的菜单。`erupt-upms` 的模块中心不做插件市场，也不卸载任何 jar：**"关掉模块"只是 `e_upms_module.enabled` 的一列状态**，真正干活的是启动时那套把菜单表和代码声明逐字段对账的 `EruptMenuSeeder`。
>
> _发布于 2026-11-04 · 阅读 ~9 min_

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

模块多了，两个老问题一起来：**升级之后新菜单进不了库**，以及**不用的功能占满侧栏**。国内常见的处理是：

- **若依 RuoYi / JeecgBoot**：菜单是数据库里的行，模块升级通常附带一份菜单 SQL，由使用者执行；代码生成器同样产出菜单 SQL。
- **钉钉宜搭 / 腾讯微搭 / 简道云**：应用、页面的上下线是平台自己的能力，和你写的业务代码是两套东西。

这些产品的内部实现我们没有看到，不做结论。我们能说的是 Erupt 的约束：模块是 Spring Boot starter，**菜单是权限的最小单位**（见[菜单管理](/zh/modules/erupt-upms/menu)）。所以我们给出的命题是：

> **模块的"开"与"关"，不新增任何运行时机制——它只是菜单表上的一次对账，外加一列记录。**

2.4.0 之前，菜单只在首次启动时写入，依据是 `.erupt/<module>.loaded` 标记文件：容器重建就丢，集群各节点各持一份，升级新增的菜单也进不了库。模块中心是在换掉这个机制之后，顺手长出来的一个页面。

## 二、两层：声明在代码，状态在库里

| 层 | 谁负责 | 落在哪 |
|---|---|---|
| 声明 | `xyz.erupt.core.module.EruptModule#initMenus()` 返回 `List<MetaMenu>` | 代码 |
| 说明 | `xyz.erupt.core.module.ModuleInfo`：`name`、`group`、`description`、`docs` | 代码 + i18n CSV |
| 状态 | `xyz.erupt.upms.model.EruptModuleSeed`（表 `e_upms_module`） | 数据库 |
| 对账 | `xyz.erupt.upms.service.EruptMenuSeeder` | 每次启动 |

状态放在数据库而不是标记文件里，注释写得很直白："so containers, clusters and copied databases all agree on it"。

## 三、一组可数的事实

- 主仓里实现 `EruptModule` 的类 **46 个**，每个都填了 `ModuleGroup`：`DATA` 15、`PLATFORM` 10、`AI` 7、`DEV_TOOLS` 5、`OPS` 5、`BUSINESS` 4；
- `ModuleGroup` 是一个 7 值枚举（另有 `DEMO`），模块中心按它分组、侧栏按它给根菜单加小标题；
- 根菜单排序按用途落在固定区间：平台 0–20、业务 30–80、AI 100–150、开发工具 200–240、运维 300–340；
- `EruptModuleSeed` 只有 6 列有业务含义：`module`、`fingerprint`、`eruptVersion`、`snapshot`、`seededAt`、`enabled`，外加一列给模块存小段数据的 `payload`。

一个模块想进模块中心，只要在 `info()` 里多填三项：

```java
@Override
public ModuleInfo info() {
    return ModuleInfo.builder().name(ERUPT_UPMS).group(ModuleGroup.PLATFORM)
            .description("Users, roles, organizations, menus and permissions of the application")
            .docs(ModuleInfo.eruptDocs("modules/erupt-upms/")).build();
}
```

`description` 是 i18n key，翻译放在模块自己的 `*.i18n.csv` 里；`docs` 里的 `{lang}` 占位符由前端按读者语言填。

## 四、对账：逐字段的三方合并

`EruptMenuSeeder` 的第一步极便宜：把 `initMenus()` 展开（含 `@Erupt(power)` 决定的功能按钮），做一个 SHA-256 `fingerprint`，和库里的一致就跳过——**没变的模块只多一次查询**。指纹里还混了 `"menu-seed/1"` 这个算法版本号，改了菜单推导方式，所有模块会重新对账一次。

指纹不一致才进入 `reconcile`。它对每个菜单、每个字段做三方比较：

```java
// Per field: still what the module wrote last time means nobody touched it, so take the new definition
private void merge(EruptMenu row, Snap last, Snap target, Map<String, EruptMenu> rows) {
    if (Objects.equals(row.getName(), last.name)) row.setName(target.name);
    if (Objects.equals(row.getType(), last.type)) row.setType(target.type);
    if (Objects.equals(row.getValue(), last.value)) row.setValue(target.value);
    if (Objects.equals(row.getSort(), last.sort)) row.setSort(target.sort);
    if (Objects.equals(row.getIcon(), last.icon)) row.setIcon(target.icon);
    if (Objects.equals(row.getStatus(), last.status)) row.setStatus(target.status);
    String parent = null == row.getParentMenu() ? null : row.getParentMenu().getCode();
    if (Objects.equals(parent, last.parent) && !Objects.equals(parent, target.parent)) row.setParentMenu(this.menu(target.parent, rows));
}
```

三方是：库里现在的值（`row`）、模块**上次写入**的值（`snapshot` 里存的 `last`）、模块**这次声明**的值（`target`）。库里的值等于上次写入的，说明没人动过，直接换新；不等于，说明管理员改过，保留。管理员把"订单管理"改名、换图标，升级之后不会被覆盖，而模块新加的菜单照常进来。

库里没有这行就新建；定义没变而被管理员删掉的菜单，**不会复活**。

## 五、关闭 = 禁用，不是隐藏，更不是删除

"模块下线"在这里复用的是同一条路径。`EruptMenuSeeder#disable` 把模块的声明当作空列表去对账：

```java
@Transactional
public void disable(String module) {
    Map<String, List<MetaMenu>> definitions = definitions(declaring());
    EruptModuleSeed seed = moduleStore.lock(module, moduleStore.find(module));
    Map<String, Snap> snapshot = this.reconcile(List.of(), parse(seed.getSnapshot()), shared(module, definitions));
    seed.setSnapshot(GSON.toJson(snapshot));
    seed.setEnabled(false);
    moduleStore.markSeeded(seed);
    log.info("Module '{}' switched off, its menus are disabled", module);
}
```

"模块不再声明的菜单"和"模块被关掉后的菜单"是同一件事，所以走同一段代码：状态改为 `DISABLE`，行不删。三个细节：

1. **禁用，不是隐藏。**源码注释写明："a hidden menu would still grant access"——隐藏的菜单仍会授权，禁用的菜单退出导航树**并且不再授权**。
2. **只动模块独有的菜单。**`shared(...)` 把"另一个模块也声明了"的菜单码排除在外，所以"系统管理"这种多个模块共用的目录不会因为关掉其中一个而消失。
3. **只改仍等于上次写入状态的行。**管理员手动改过状态的菜单，不会被这次关闭动到。

重新打开时 `enable` 以 `force = true` 对账，但传入的 `initFun` 是空实现——**一次性初始化不会再执行一遍**。启动时 `seedAll` 遇到 `isDisabled()` 的模块直接 `return`，所以"关闭"会跨重启保持。

:::tip 反直觉的小结
关掉模块，代码、表、定时任务、Bean 都还在，**关的是入口，不是实现**。这是有意的：真卸载意味着类加载、数据迁移、回滚的整套难题；而"侧栏里看不见、角色里勾不到"已经解决了新人最痛的那一半。要连实现一起去掉，请去掉依赖。
:::

## 六、两条硬规则

`EruptModuleCenterService` 里有两处不让步：

- `ESSENTIAL = Set.of(EruptUpmsAutoConfiguration.ERUPT_UPMS)`：`erupt-upms` 的 `ModuleVo.enabled` 为 `null`，调用 `enabled` 时抛 `upms.module_fixed`。理由写在注释里："switching these off would take the menu that switches them back on with them"。
- 不声明菜单的模块（`ModuleVo.enabled` 为 `null`）没有开关，只展示；`EruptModuleController` 的两个接口都按模块中心菜单的 `VerifyType.MENU` 校验，开关本身也受权限管。

## 七、跟若依 / JeecgBoot / 宜搭怎么比？

我们没有逐项实测这些产品。左列是**选型时值得问的问题**，以各自官方文档为准。

| 维度 | 国内对位：选型时该问 | Erupt |
|---|---|---|
| 升级后新菜单怎么进库 | 若依、JeecgBoot：是否靠随版本发布的菜单 SQL、由人执行？ | 启动时按指纹对账，变了才写 |
| 管理员改过的菜单 | 升级脚本会不会覆盖改名、换图标、调排序？ | 逐字段三方合并，改过的保留 |
| 不用的功能怎么收起来 | 宜搭、微搭：应用下线与代码部署是否是两件事？ | 模块中心一个开关，禁用菜单并跨重启保持 |
| 集群与容器 | 初始化状态存在文件还是库里？多实例同启会不会重复插入？ | `e_upms_module` 一行一模块，启动时在该行加锁串行 |
| 新人看地图 | 菜单是平铺，还是按用途分组？ | `ModuleGroup` 分组 + 根菜单排序区间，侧栏带小标题 |

## 八、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

模块中心属于 `erupt-upms`，随基础依赖即有，登录后在「系统管理 → 模块中心」。自己的模块想出现在里面，实现 `EruptModule` 并填好 `ModuleInfo`，见[插件开发](/zh/advanced/plugin#moduleinfo)。启动时的菜单对账受 `erupt.init-modules-menu` 控制（默认 `true`），设为 `false` 时 `initFun()` 也不会执行。

## 九、代价与下一期预告

- **关的只是菜单。**模块的 Bean、接口、定时任务仍在运行；已知该模块 URL 的人，仍受角色权限约束，而不是被"卸载"挡住。
- **对账是逐字段的，不是逐行的。**管理员改过名称、模块又改了名称，保留的是管理员的；想"恢复成模块默认"，需要手工改回。
- **`snapshot` 是一段 JSON。**它能表达三方合并，但不是给人读的审计流水。
- **不声明菜单的模块没有开关。**它们只在模块中心展示。

下一期回到数据层：主仓 #447 给列表加了「批量修改」——选中若干行，对同一个字段一次写入同一个值。直觉上这是一条 `UPDATE ... WHERE id IN (...)`，源码里它**每一行都走一遍已有的单元格编辑管线**：校验、行级权限、`DataProxy` 钩子、操作日志，任何一行被拒整批回滚。**批量操作为什么不该绕过管线**，下期细说。

---

:::info 参与讨论
本期涉及的源码：`erupt-core/.../core/module/EruptModule.java`、`ModuleInfo.java`、`ModuleGroup.java`，以及 `erupt-upms/.../upms/service/EruptMenuSeeder.java`、`EruptModuleCenterService.java`、`controller/EruptModuleController.java`、`model/EruptModuleSeed.java`。

模块该不该支持"真卸载"，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴。
:::
