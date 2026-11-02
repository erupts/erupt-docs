# Module & Plugin Development

You can implement the `EruptModule` interface to build module extensions on top of Erupt.

## Implement the Interface

```java
@Component
public class EruptDemoModule implements EruptModule {

    static {
        EruptModuleInvoke.addEruptModule(EruptDemoModule.class);
    }

    // Module metadata: name, group, one-sentence description, docs link
    @Override
    public ModuleInfo info() {
        return ModuleInfo.builder().name("erupt-demo")
                .group(ModuleGroup.BUSINESS)
                .description("Orders, customers and invoices")
                .docs("https://example.com/docs/erupt-demo")
                .build();
    }

    // Initialization method — runs on every startup
    @Override
    public void run() {

    }

    // Module menus → reconciled with the database on every start;
    // a changed definition is merged field by field, admin edits are kept
    @Override
    public List<MetaMenu> initMenus() {
        return null;
    }

    // Initialization function → runs once per database, before the module's
    // first menu seeding (tracked in e_upms_module)
    @Override
    public void initFun() {

    }
}
```

:::tip No marker files since 2.4.0
Before 2.4.0 `initMenus()` and `initFun()` ran once, guarded by a `.erupt/<module>.loaded` marker file. The state now lives in the database table `e_upms_module`: menus are reconciled by fingerprint on every start and `initFun()` runs once per database, so new containers and cluster nodes neither repeat nor miss anything. See [Automatic Module Menu Maintenance](/en/modules/erupt-upms/menu#automatic-module-menu-maintenance) for the rules; the switch is `erupt.init-modules-menu` (default `true`).
:::

## ModuleInfo

> `group`, `description` and `docs` are 2.4.0+

`ModuleInfo` is built with its builder; every member besides the name feeds the [Module Center](/en/modules/erupt-upms/menu#module-center):

| Member | Description |
| --- | --- |
| `name` | Module name, unique. Also the value of `e_upms_module.module`, so do not change it once released |
| `group` | A `ModuleGroup`: `PLATFORM`, `BUSINESS`, `AI`, `DEV_TOOLS`, `OPS`, `DATA`. The Module Center lists modules by it and the sidebar titles root menus by it; a module without one is listed under "Other" |
| `description` | One sentence on what the module solves; translated as an i18n key into the reader's language |
| `docs` | Documentation URL. May contain a `{lang}` placeholder that the frontend replaces with `zh` / `en` by UI language; `ModuleInfo.eruptDocs("modules/erupt-job")` builds the URL of that page on docs.erupt.xyz |

Keep root menu sort values within the range of the module's group (platform 0–20, business 30–80, AI 100–150, developer tools 200–240, operations 300–340) so the sidebar's section titles stay contiguous, see [Root Menu Sort Ranges](/en/modules/erupt-upms/menu#root-menu-sort-ranges).

## MetaMenu.after

> 2.4.0+

`MetaMenu.after(code)` places a menu right after the sibling with that code: its sort becomes the sibling's current sort + 1, wherever an administrator has moved it, with no sort value to hard-code.

```java
@Override
public List<MetaMenu> initMenus() {
    MetaMenu manager = EruptUpmsAutoConfiguration.managerMenu();
    return List.of(manager,
            // under "System Management", right after "User Management"
            MetaMenu.createEruptClassMenu(DemoAudit.class, manager, 0).after(EruptUser.class.getSimpleName()));
}
```

`after` is part of the menu fingerprint too, so changing it is reconciled at the next start.

## Reference Implementation

For the best practice of initializing menus, refer to the following file:

[erupt/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java](https://github.com/erupts/erupt/blob/master/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java)
