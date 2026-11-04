# 表单视图（FormView）

将一个 Erupt 类渲染为全页表单，不绑定任何表格视图。适合"系统设置"、"个人资料"等只有一条记录需要编辑的场景。数据的加载和保存完全由开发者通过 `DataProxy` 控制，框架不执行任何数据库操作。

> **2.0.0 及以上版本支持**

## 工作原理

1. 在菜单管理中，将菜单类型设置为 **Form View**，值填写 Erupt 类名。
2. 打开该菜单时，前端渲染完整的表单页面，顶部显示所有字段，底部有 **保存** 和 **重置** 按钮。
3. 框架在打开时调用 `DataProxy.formViewBehavior(model)`，开发者在此方法中从数据源加载数据并填充 `model` 字段。
4. 用户点击保存后，框架先执行字段级校验（含 `DataProxy.validate`），再调用 `DataProxy.formSave(model)`，开发者在此方法中持久化数据。
5. 点击重置将重新调用后端加载接口，恢复到最近一次保存的状态。

## 菜单配置

| 字段     | 值             |
|--------|----------------|
| 菜单类型 | Form View      |
| 菜单值   | Erupt 类名（如 `SystemConfig`） |

## DataProxy 钩子

| 方法 | 触发时机 | 用途 |
|------|---------|------|
| `formViewBehavior(MODEL model)` | 打开表单时（GET） | 从数据源读取数据，填充 model 字段 |
| `formSave(MODEL model)` | 点击保存、校验通过后（POST） | 将 model 持久化到数据源；抛出 `EruptException` 可中止保存并向用户显示错误 |

## 完整示例

以"系统配置"为例，将配置项存储在数据库的 `t_sys_config` 表中（只有一行数据）：

```java
@Erupt(name = "系统配置", dataProxy = SystemConfigProxy.class)
public class SystemConfig {

    @EruptField(
        views = @View(title = "站点名称"),
        edit  = @Edit(title = "站点名称", notNull = true)
    )
    private String siteName;

    @EruptField(
        views = @View(title = "备案号"),
        edit  = @Edit(title = "备案号")
    )
    private String icp;

    @EruptField(
        views = @View(title = "维护模式"),
        edit  = @Edit(title = "维护模式")
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
        // 从数据库加载唯一一行配置，填充到 model
        SysConfigEntity entity = repo.findFirstByOrderByIdAsc();
        if (entity != null) {
            model.setSiteName(entity.getSiteName());
            model.setIcp(entity.getIcp());
            model.setMaintenance(entity.getMaintenance());
        }
    }

    @Override
    public void formSave(SystemConfig model) throws EruptException {
        // 将 model 持久化到数据库
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

## 与普通表格视图的对比

| 特性 | 表格视图（TABLE） | 独立表单视图（FORM） |
|------|----------------|-------------------|
| 适合场景 | 多行记录的增删改查 | 单记录编辑（设置页、个人资料等） |
| 数据库操作 | 框架自动处理 | 完全由开发者控制 |
| DataProxy 钩子 | beforeAdd/afterAdd/... | formViewBehavior/formSave |
| 页面布局 | 表格 + 弹窗表单 | 全页表单 |

## 注意事项

- `formViewBehavior` 和 `formSave` 是 `DataProxy` 接口中的默认方法，不实现时为空操作。
- 字段级校验（`@Edit(notNull = true)` 等）在 `formSave` 之前自动执行，无需手动调用。
- `formSave` 抛出 `EruptException` 时，前端显示错误消息并中止保存。
- 该视图没有"新增"和"删除"按钮，不调用 `beforeAdd` / `afterAdd` / `beforeDelete` / `afterDelete` 钩子。
