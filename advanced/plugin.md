# 插件开发（为 erupt 开发插件）

可通过实现 `EruptModule` 接口，完成基于 erupt 的模块扩展。

## 实现接口

```java
@Component
public class EruptDemoModule implements EruptModule {

    static {
        EruptModuleInvoke.addEruptModule(EruptJpaAutoConfiguration.class);
    }

    // 模块信息
    @Override
    public ModuleInfo info() {
        return ModuleInfo.builder().name("xxx").build();
    }

    // 初始化方法，每次启动时执行
    @Override
    public void run() {

    }

    // 初始化菜单 → 仅模块初始化时执行一次，标识文件位置 .erupt/.${moduleName}
    @Override
    public List<MetaMenu> initMenus() {
        return null;
    }

    // 初始化方法 → 仅模块初始化时执行一次，标识文件位置 .erupt/.${moduleName}
    @Override
    public void initFun() {

    }
}
```

## 参考实现

初始化菜单的最佳实践可参考如下文件：

[erupt/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java](https://github.com/erupts/erupt/blob/master/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java)
