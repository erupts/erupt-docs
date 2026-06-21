# FormView — Standalone Form Page

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
