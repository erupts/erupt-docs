# Form View (FormView)

Renders an Erupt class as a full-page form without any table view. Designed for "single-record" scenarios such as system settings or user profile pages. Data loading and persistence are entirely the developer's responsibility via `DataProxy` — the framework performs no database operations.

> **Supported in 2.0.0+**

## How It Works

1. In the menu manager, set the menu type to **Form View** and the value to the Erupt class name.
2. Opening the menu renders a full-page form with all fields visible and **Save** / **Reset** buttons at the bottom.
3. On open, the framework calls `DataProxy.formViewBehavior(model)` — populate the model's fields from your data source here.
4. When the user clicks Save, the framework runs field-level validation (including `DataProxy.validate`), then calls `DataProxy.formSave(model)` — persist the data here.
5. Clicking Reset re-triggers the backend load endpoint, restoring the last-saved state.

## Menu Configuration

| Field | Value |
|-------|-------|
| Menu Type | Form View |
| Menu Value | Erupt class name (e.g. `SystemConfig`) |

## Endpoints

The form view has its own two endpoints (`EruptFormViewController`), completely separate from the table view's CRUD endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/erupt-api/data/form-view/{erupt}` | Open the form; fires `formViewBehavior` |
| POST | `/erupt-api/data/form-view/{erupt}` | Save the form; validates first, then fires `formSave` |

`{erupt}` is the Erupt class name. Both endpoints require the `token` and `erupt` (Erupt class name) request headers — the frontend sets them automatically.

## Permissions

**A form view that returns 403 on open, or a Save button that does nothing, is almost always a permission configuration problem.** Authorization happens in two layers, and both must pass:

### Layer 1: Menu permission

The role must be granted **the Form View menu itself** (the menu whose value equals the Erupt class name). Otherwise the endpoint returns 403 immediately.

### Layer 2: Function permission (ADD / EDIT)

Both the GET and POST handlers in `EruptFormViewController` require `power.add || power.edit` to be `true`:

```java
Erupts.powerLegal(eruptModel, powerObject -> powerObject.isAdd() || powerObject.isEdit());
```

That `power` is the intersection of two sources:

1. **Code side**: whatever `@Erupt(power = @Power(add = ..., edit = ...))` declares. If both `add` and `edit` are `false`, the form view can **never** be opened.
2. **Role side**: `UpmsPowerHandler` checks whether the current user holds the `<EruptClassName>@ADD` / `<EruptClassName>@EDIT` function permissions, and flips `add` / `edit` to `false` when they are missing.

> Exception: `@Erupt(authVerify = false)` skips the whole UPMS authorization chain, so role permissions no longer apply.

### ADD / EDIT function permissions are generated automatically

**Since 2026-08-27**, `FORM` menus generate function-permission button sub-menus automatically, just like `TABLE` / `TREE` menus. No manual creation is needed.

`EruptFunPermissions.byMenuType()` defines which function permissions apply to each menu type:

| Menu type | Auto-generated function permissions |
|-----------|-------------------------------------|
| `table` / `tree` | ADD, EDIT, DELETE, EXPORT, IMPORT, DETAIL (all 6) |
| `form` | **ADD, EDIT** (a form view only has "first save" and "subsequent save" semantics) |
| Other types | None |

Generation happens in two places:

- **At application startup**: `UpmsDataLoadService` walks the menus declared by each module's `initMenus()` and back-fills ADD / EDIT button sub-menus for FORM menus. Whether it runs is controlled by `erupt.init-method-enum` (`FILE` = first boot only, `EVERY` = every boot, `NONE` = never).
- **When a menu is created manually**: after you add and save a FORM menu in Menu Management, `EruptMenuService.afterAdd` immediately creates its ADD / EDIT sub-menus.

The generated sub-menus look like this:

| Field | Value |
|-------|-------|
| Name | `ADD` / `EDIT` |
| Menu type | `button` (function button) |
| Menu value | `<EruptClassName>@ADD` / `<EruptClassName>@EDIT` |
| Parent menu | The corresponding Form View menu |

> Only the function permissions allowed by `@Erupt(power = @Power(...))` are generated. For example, with `@Power(add = false)` no `ADD` sub-menu is created.

### What to tick on the role side

Under **Role Management → Menu Permissions**, tick the following for the target role:

1. ✅ The **Form View menu** itself
2. ✅ Its **ADD** and/or **EDIT** button sub-menus (at least one, otherwise opening the view returns 403)

Ticking both is usually what you want: `ADD` covers the first save and `EDIT` covers subsequent saves, and business flows normally need both.

### The old manual approach is no longer required

Before auto-generation existed, you had to manually create two `button` sub-menus under the Form View menu, with menu values `<EruptClassName>@ADD` and `<EruptClassName>@EDIT`. **The framework now creates them for you — do not create them by hand.**

If you are upgrading an existing project:

- Manually created sub-menus are preserved. Startup back-fill goes through `persistIfNotExist` (deduplicated by menu `code`), so module built-in menus are not inserted twice.
- If an old hand-made sub-menu has a wrong menu value (casing or typo), the permission check silently fails. Verify it reads exactly `<EruptClassName>@ADD` / `<EruptClassName>@EDIT`.

## DataProxy Hooks

| Method | Trigger | Purpose |
|--------|---------|---------|
| `formViewBehavior(MODEL model)` | On open (GET) | Read data from your data source and populate model fields |
| `formSave(MODEL model)` | On save after validation passes (POST) | Persist the model to your data source; throw `EruptException` to abort with a user-visible error |

## Complete Example

System settings backed by a single row in `t_sys_config`:

```java
@Erupt(name = "System Settings", dataProxy = SystemConfigProxy.class)
public class SystemConfig {

    @EruptField(
        views = @View(title = "Site Name"),
        edit  = @Edit(title = "Site Name", notNull = true)
    )
    private String siteName;

    @EruptField(
        views = @View(title = "ICP Number"),
        edit  = @Edit(title = "ICP Number")
    )
    private String icp;

    @EruptField(
        views = @View(title = "Maintenance Mode"),
        edit  = @Edit(title = "Maintenance Mode")
    )
    private Boolean maintenance;

}
```

```java
@Service
public class SystemConfigProxy implements DataProxy<SystemConfig> {

    @Autowired
    private SysConfigRepository repo;

    @Override
    public void formViewBehavior(SystemConfig model) {
        // Load the single config row and populate the model
        SysConfigEntity entity = repo.findFirstByOrderByIdAsc();
        if (entity != null) {
            model.setSiteName(entity.getSiteName());
            model.setIcp(entity.getIcp());
            model.setMaintenance(entity.getMaintenance());
        }
    }

    @Override
    public void formSave(SystemConfig model) throws EruptException {
        // Persist the model back to the database
        SysConfigEntity entity = repo.findFirstByOrderByIdAsc();
        if (entity == null) {
            entity = new SysConfigEntity();
        }
        entity.setSiteName(model.getSiteName());
        entity.setIcp(model.getIcp());
        entity.setMaintenance(model.getMaintenance());
        repo.save(entity);
    }

}
```

## Comparison: Table View vs Form View

| Feature | Table View (TABLE) | Form View (FORM) |
|---------|--------------------|-----------------|
| Use case | Multi-row CRUD | Single-record editing (settings, profile) |
| DB operations | Handled by the framework | Fully controlled by the developer |
| DataProxy hooks | beforeAdd / afterAdd / … | formViewBehavior / formSave |
| Page layout | Table + modal form | Full-page form |

## Notes

- `formViewBehavior` and `formSave` are default methods on `DataProxy` — no-ops unless overridden.
- Field-level validation (`@Edit(notNull = true)` etc.) runs automatically before `formSave`.
- Throwing `EruptException` from `formSave` shows an error message to the user and aborts the save.
- The view has no Add or Delete buttons — `beforeAdd` / `afterAdd` / `beforeDelete` / `afterDelete` hooks are never called.
