# Plugin Development

You can implement the `EruptModule` interface to build module extensions on top of Erupt.

## Implement the Interface

```java
@Component
public class EruptDemoModule implements EruptModule {

    static {
        EruptModuleInvoke.addEruptModule(EruptJpaAutoConfiguration.class);
    }

    // Module metadata
    @Override
    public ModuleInfo info() {
        return ModuleInfo.builder().name("xxx").build();
    }

    // Initialization method — runs on every startup
    @Override
    public void run() {

    }

    // Initialize menus → runs only once during module initialization
    // Marker file location: .erupt/.${moduleName}
    @Override
    public List<MetaMenu> initMenus() {
        return null;
    }

    // Initialization function → runs only once during module initialization
    // Marker file location: .erupt/.${moduleName}
    @Override
    public void initFun() {

    }
}
```

## Reference Implementation

For the best practice of initializing menus, refer to the following file:

[erupt/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java](https://github.com/erupts/erupt/blob/master/erupt-upms/src/main/java/xyz/erupt/upms/EruptUpmsAutoConfiguration.java)
