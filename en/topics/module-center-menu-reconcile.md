---
title: "EruptModule × MenuSeeder × ModuleGroup: Switching a Module Off Is a Column, Not an Uninstall"
description: "The app center or plugin market of a typical low-code platform is a separate install-and-uninstall mechanism. Erupt's module center does the opposite: switching a module off disables the menus only it declares and records that in one column. This issue covers the three-way menu reconcile, 'disabled, not hidden', and the cost."
outline: deep
---

# Issue 27 · Switching a Module Off Is Not an Uninstall

> With 46 modules installed, a newcomer faces a wall of menus they cannot read. The module center in `erupt-upms` is not a plugin market and unloads no jar: **"switching a module off" is one column, `e_upms_module.enabled`**. The real work is done by `EruptMenuSeeder`, which reconciles the menu table with what the code declares, field by field, on every start.
>
> _Published 2026-11-04 · ~9 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

More modules bring two old problems together: **new menus never reach the database after an upgrade**, and **unused features crowd the sidebar**. The usual answers in the Chinese ecosystem:

- **RuoYi / JeecgBoot**: menus are database rows; a module upgrade typically ships a menu SQL script that someone runs, and the code generator also emits menu SQL.
- **DingTalk Yida / Tencent Weda / Jiandaoyun**: taking an app or page online or offline is a platform feature, separate from the business code you write.

We have not seen how these products work inside and draw no conclusions. What we can state is Erupt's constraint: a module is a Spring Boot starter and **the menu is the smallest unit of permission** (see [Menu Management](/en/modules/erupt-upms/menu)). So our claim is:

> **Switching a module on or off adds no runtime mechanism. It is one reconcile of the menu table plus one recorded column.**

Before 2.4.0 menus were written once on first start, keyed on a `.erupt/<module>.loaded` marker file: lost when a container is rebuilt, kept per node in a cluster, and blind to menus added by an upgrade. The module center is a page that grew out of replacing that mechanism.

## 2. Two layers: declared in code, state in the database

| Layer | Owner | Lives in |
|---|---|---|
| Declaration | `xyz.erupt.core.module.EruptModule#initMenus()` returns `List<MetaMenu>` | code |
| Description | `xyz.erupt.core.module.ModuleInfo`: `name`, `group`, `description`, `docs` | code + i18n CSV |
| State | `xyz.erupt.upms.model.EruptModuleSeed` (table `e_upms_module`) | database |
| Reconcile | `xyz.erupt.upms.service.EruptMenuSeeder` | every start |

State sits in the database, not a marker file, and the class comment says why: "so containers, clusters and copied databases all agree on it".

## 3. Countable facts

- **46** classes in the main repo implement `EruptModule`, and every one fills in a `ModuleGroup`: `DATA` 15, `PLATFORM` 10, `AI` 7, `DEV_TOOLS` 5, `OPS` 5, `BUSINESS` 4;
- `ModuleGroup` is a 7-value enum (plus `DEMO`); the module center groups by it and the sidebar titles root menus with it;
- root menus sort into fixed ranges by purpose: platform 0–20, business 30–80, AI 100–150, developer tools 200–240, operations 300–340;
- `EruptModuleSeed` has six meaningful columns, `module`, `fingerprint`, `eruptVersion`, `snapshot`, `seededAt`, `enabled`, plus `payload` for small per-database values.

A module joins the module center by filling three more fields in `info()`:

```java
@Override
public ModuleInfo info() {
    return ModuleInfo.builder().name(ERUPT_UPMS).group(ModuleGroup.PLATFORM)
            .description("Users, roles, organizations, menus and permissions of the application")
            .docs(ModuleInfo.eruptDocs("modules/erupt-upms/")).build();
}
```

`description` is an i18n key translated in the module's own `*.i18n.csv`; the `{lang}` placeholder in `docs` is filled in by the frontend with the reader's language.

## 4. Reconcile: a per-field three-way merge

The first step of `EruptMenuSeeder` is cheap: expand `initMenus()` (including the function buttons derived from `@Erupt(power)`), take a SHA-256 `fingerprint`, and skip the module if it equals the stored one. **An unchanged module costs one query.** The fingerprint also mixes in the algorithm tag `"menu-seed/1"`, so changing how menus are derived reconciles every module once.

Only a mismatch enters `reconcile`, which compares every field of every menu three ways:

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

The three sides are the current database value (`row`), what the module **wrote last time** (`last`, from `snapshot`), and what the module **declares now** (`target`). A value equal to the last write was never touched, so it takes the new definition; a value that differs was edited by an administrator and is kept. If an administrator renamed "Orders" and changed its icon, an upgrade does not overwrite that, while menus the module newly adds still arrive.

A menu missing from the database is created; one the administrator deleted while its definition stayed unchanged is **not resurrected**.

## 5. Off means disabled: not hidden, not deleted

Taking a module offline reuses the same path. `EruptMenuSeeder#disable` reconciles the module against an empty declaration:

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

"A menu the module no longer declares" and "a menu of a module switched off" are the same event, so they share one code path: the status becomes `DISABLE` and the row stays. Three details:

1. **Disabled, not hidden.** The source comment says it: "a hidden menu would still grant access". A disabled menu leaves the navigation tree **and grants nothing**.
2. **Only the menus the module alone declares.** `shared(...)` excludes codes another module declares too, so a directory such as System Management does not vanish because one module is off.
3. **Only rows still holding the last-written status.** A menu whose status an administrator changed is left alone.

`enable` reconciles with `force = true`, but passes an empty `initFun`: **one-off initialisation does not run twice.** On start `seedAll` returns early for a module with `isDisabled()`, so the switch survives restarts.

:::tip Counter-intuitive takeaway
Switch a module off and its code, tables, jobs and beans are all still there: **you close the entrance, not the implementation.** That is deliberate. A real uninstall means class loading, data migration and rollback, while "not in the sidebar, not tickable in a role" already solves the half that hurts a newcomer most. To remove the implementation too, remove the dependency.
:::

## 6. Two hard rules

`EruptModuleCenterService` does not bend in two places:

- `ESSENTIAL = Set.of(EruptUpmsAutoConfiguration.ERUPT_UPMS)`: `erupt-upms` has `ModuleVo.enabled` as `null` and `enabled(...)` throws `upms.module_fixed`. The comment gives the reason: "switching these off would take the menu that switches them back on with them".
- A module that declares no menus (`ModuleVo.enabled` is `null`) has no switch and is only listed; both endpoints in `EruptModuleController` are checked against the module center menu with `VerifyType.MENU`, so the switch is itself under permission.

## 7. How does it compare with RuoYi / JeecgBoot / Yida?

We did not test these products item by item. The middle column lists **questions worth asking when choosing**; rely on each product's own documentation.

| Dimension | Domestic counterparts: what to ask | Erupt |
|---|---|---|
| How new menus reach the database after an upgrade | RuoYi, JeecgBoot: does it rely on a menu SQL script shipped with the release and run by a person? | Reconciled on start by fingerprint, written only on change |
| Menus an administrator edited | Does the upgrade script overwrite renames, icons, sort order? | Per-field three-way merge; edits are kept |
| Putting unused features away | Yida, Weda: is taking an app offline separate from deploying code? | One switch in the module center; menus disabled and kept across restarts |
| Clusters and containers | Is init state in a file or the database? Can instances starting together insert twice? | One row per module in `e_upms_module`, serialised by a lock on that row at start |
| A map for newcomers | Are menus flat or grouped by purpose? | `ModuleGroup` plus root-menu sort ranges, sidebar section titles |

## 8. Five minutes to try it

The full path from an empty project to a working admin page is its own page:

**→ [Quick Start](/guide/quick-start)**

The module center belongs to `erupt-upms`, so it comes with the base dependency: after login open System Management → Module Center. To list your own module, implement `EruptModule` and fill in `ModuleInfo`; see [Plugin Development](/en/advanced/plugin#moduleinfo). Reconcile on start is controlled by `erupt.init-modules-menu` (default `true`); with `false`, `initFun()` does not run either.

## 9. Costs, and next issue

- **Only menus are switched off.** The module's beans, endpoints and jobs keep running; someone who knows a URL is still held by role permissions, not by an "uninstall".
- **The reconcile is per field, not per row.** If an administrator renamed a menu and the module renames it too, the administrator's name stays; getting back to the module default takes a manual edit.
- **`snapshot` is a JSON blob.** It carries a three-way merge, but it is not an audit trail meant for reading.
- **A module without menus has no switch.** It is only listed in the module center.

Next issue returns to the data layer: #447 added "batch edit" to lists, where you select rows and write one value to one field. It looks like `UPDATE ... WHERE id IN (...)`, but in the source **every row goes through the existing cell-edit pipeline**: validation, row permission, `DataProxy` hooks, the operate log, and any rejected row rolls the whole batch back. **Why a batch operation should not bypass the pipeline** is the next topic.

---

:::info Join the discussion
Source covered in this issue: `erupt-core/.../core/module/EruptModule.java`, `ModuleInfo.java`, `ModuleGroup.java`, and `erupt-upms/.../upms/service/EruptMenuSeeder.java`, `EruptModuleCenterService.java`, `controller/EruptModuleController.java`, `model/EruptModuleSeed.java`.

Should modules support a real uninstall? Leave a note in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
