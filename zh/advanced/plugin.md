# 模块与插件开发

可通过实现 `EruptModule` 接口，完成基于 erupt 的模块扩展。

## 实现接口

```java
@Component
public class EruptDemoModule implements EruptModule {

    static {
        EruptModuleInvoke.addEruptModule(EruptDemoModule.class);
    }

    // 模块信息：名称、分组、一句话说明、文档链接
    @Override
    public ModuleInfo info() {
        return ModuleInfo.builder().name("erupt-demo")
                .group(ModuleGroup.BUSINESS)
                .description("Orders, customers and invoices")
                .docs("https://example.com/docs/erupt-demo")
                .build();
    }

    // 初始化方法，每次启动时执行
    @Override
    public void run() {

    }

    // 模块菜单 → 每次启动与数据库对齐，定义变化时逐字段合并，管理员的修改保留
    @Override
    public List<MetaMenu> initMenus() {
        return null;
    }

    // 初始化方法 → 每个数据库只执行一次，在模块首次写入菜单之前（记录在 e_upms_module）
    @Override
    public void initFun() {

    }
}
```

:::tip 2.4.0 起不再使用标记文件
2.4.0 之前 `initMenus()` 与 `initFun()` 依据 `.erupt/<module>.loaded` 标记文件只执行一次。现在状态保存在数据库表 `e_upms_module` 中：菜单每次启动按指纹对齐，`initFun()` 每个数据库执行一次，容器重建、集群多节点都不会重复或遗漏。规则详见[模块菜单的自动维护](/zh/modules/erupt-upms/menu#模块菜单的自动维护)，开关为 `erupt.init-modules-menu`（默认 `true`）。
:::

## ModuleInfo

> `group`、`description`、`docs` 为 2.4.0+

`ModuleInfo` 通过 builder 构造，除名称外的成员都用于[模块中心](/zh/modules/erupt-upms/menu#模块中心)展示：

| 成员 | 说明 |
| --- | --- |
| `name` | 模块名，唯一。也是 `e_upms_module.module` 的值，发布后不要再改 |
| `group` | `ModuleGroup` 枚举：`PLATFORM` 平台、`BUSINESS` 业务、`AI`、`DEV_TOOLS` 开发工具、`OPS` 运维、`DATA` 数据源。模块中心按它分组，侧栏按它给根菜单加分组标题；不填则列在「其他」 |
| `description` | 一句话说明模块解决什么问题；作为 i18n 词条按当前语言翻译 |
| `docs` | 文档地址。可含 `{lang}` 占位符，前端按界面语言替换为 `zh` / `en`；`ModuleInfo.eruptDocs("modules/erupt-job")` 生成 docs.erupt.xyz 上对应页面的地址 |

根菜单的排序值请按分组落在约定区间内（平台 0~20、业务 30~80、AI 100~150、开发工具 200~240、运维 300~340），侧栏的分组标题才能连成一段，见[根菜单排序区间](/zh/modules/erupt-upms/menu#根菜单排序区间)。

## MetaMenu.after

> 2.4.0+

`MetaMenu.after(code)` 把菜单放在编码为 `code` 的兄弟菜单之后：写入时排序取该兄弟当前排序 + 1，无论管理员把它挪到了哪里，都不必硬编码排序值。

```java
@Override
public List<MetaMenu> initMenus() {
    MetaMenu manager = EruptUpmsAutoConfiguration.managerMenu();
    return List.of(manager,
            // 挂在「系统管理」下，紧跟在「用户维护」之后
            MetaMenu.createEruptClassMenu(DemoAudit.class, manager, 0).after(EruptUser.class.getSimpleName()));
}
```

`after` 也计入模块菜单指纹，改动后下次启动会重新对齐。

## 参考实现

初始化菜单的最佳实践可参考如下文件：

[erupt/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java](https://github.com/erupts/erupt/blob/master/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java)
