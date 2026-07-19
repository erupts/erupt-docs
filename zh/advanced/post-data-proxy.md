# 全局拦截（PostDataProxy）

::: info
`PostDataProxy` 是全局 DataProxy 拦截器，对**所有** Erupt 实体类的数据操作统一生效，无需在每个 `@Erupt` 注解上单独配置。

1.13.1 及以上版本支持
:::

## 执行顺序

每次触发 DataProxy 回调时，框架按以下顺序依次执行：

```
1. 注册容器中的 @PreDataProxy（通过 registerAnnotationContainer 注册的注解）
2. 父类 / 接口上的 @PreDataProxy（沿继承链向上遍历）
3. 当前类及其接口上的 @PreDataProxy
4. @Erupt(dataProxy = ...) 指定的 DataProxy
5. PostDataProxy（全局注册，最后执行）
```

`PostDataProxy` 始终在所有局部 DataProxy **之后**触发，适合做跨切面的全局处理。

## 注册方法

实现 `DataProxy<Object>` 接口，在 `@PostConstruct` 中调用 `PostDataProxy.register(...)` 完成注册：

```java
@Component
public class GlobalAuditProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(GlobalAuditProxy.class);
    }

}
```

可注册多个 PostDataProxy，按注册顺序依次执行。

## 识别当前操作的实体类

在任意回调方法内，通过 `DataProxyContext` 获取当前正在操作的 Erupt 类信息：

```java
@Component
public class GlobalAuditProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(GlobalAuditProxy.class);
    }

    @Override
    public void afterAdd(Object model) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        Class<?> clazz = eruptModel.getClazz(); // 实际操作的实体类，如 Order.class
        String eruptName = eruptModel.getEruptName(); // 如 "Order"
        // 记录审计日志
        auditLog("ADD", clazz.getSimpleName(), model);
    }

    @Override
    public void afterUpdate(Object model) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        auditLog("UPDATE", eruptModel.getClazz().getSimpleName(), model);
    }

    @Override
    public void afterDelete(Object model) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        auditLog("DELETE", eruptModel.getClazz().getSimpleName(), model);
    }

}
```

## 按注解条件过滤

结合 `eruptModel.getClazz().getAnnotation(...)` 可以只对带有特定注解的实体类生效：

```java
@Component
public class FlowPostDataProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(FlowPostDataProxy.class);
    }

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        // 只对标注了 @EruptFlow 的实体类做额外处理
        EruptFlow eruptFlow = eruptModel.getClazz().getAnnotation(EruptFlow.class);
        if (eruptFlow == null) return;
        // 注入流程状态信息
        for (Map<String, Object> row : list) {
            row.put("flowStatus", queryFlowStatus(row.get("id")));
        }
    }

}
```

## 常见应用场景

### 全局操作审计

```java
@Component
@Slf4j
public class AuditDataProxy implements DataProxy<Object> {

    @Autowired
    private AuditLogService auditLogService;

    @PostConstruct
    public void init() {
        PostDataProxy.register(AuditDataProxy.class);
    }

    @Override
    public void afterAdd(Object model) {
        log("新增", model);
    }

    @Override
    public void afterUpdate(Object model) {
        log("修改", model);
    }

    @Override
    public void afterDelete(Object model) {
        log("删除", model);
    }

    private void log(String action, Object model) {
        String entity = DataProxyContext.get().getEruptModel().getClazz().getSimpleName();
        auditLogService.save(action, entity, model.toString());
    }

}
```

### 全局数据脱敏

```java
@Component
public class MaskDataProxy implements DataProxy<Object> {

    private static final String PHONE_FIELD = "phone";

    @PostConstruct
    public void init() {
        PostDataProxy.register(MaskDataProxy.class);
    }

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        for (Map<String, Object> row : list) {
            if (row.containsKey(PHONE_FIELD) && row.get(PHONE_FIELD) instanceof String phone) {
                // 保留前三后四，中间替换为 ****
                row.put(PHONE_FIELD, phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
            }
        }
    }

}
```

### 全局行级权限过滤

```java
@Component
public class TenantDataProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(TenantDataProxy.class);
    }

    @Override
    public String beforeFetch(List<Condition> conditions) {
        // 注入租户隔离条件（追加在所有局部 DataProxy 条件之后）
        Long tenantId = SecurityContext.currentTenantId();
        return "tenantId = " + tenantId;
    }

}
```

:::warning
当多个 PostDataProxy 都重写了 `beforeFetch` 时，每个返回的条件字符串都会被框架独立拼接为 `AND` 条件，互不覆盖。
:::

## 与局部 DataProxy 的区别

| | `@Erupt(dataProxy = ...)` | `PostDataProxy` |
|---|---|---|
| 作用范围 | 单个实体类 | 全部实体类 |
| 配置方式 | 在 `@Erupt` 注解上声明 | 调用 `PostDataProxy.register(...)` |
| 执行顺序 | 第 4 步 | 第 5 步（最后） |
| 典型用途 | 业务逻辑、字段填充、数据校验 | 审计日志、数据脱敏、租户隔离 |

所有 DataProxy 回调方法均可在 PostDataProxy 中使用，完整方法列表参考 [DataProxy 接口定义](/zh/advanced/data-proxy#dataproxy-接口定义)。
