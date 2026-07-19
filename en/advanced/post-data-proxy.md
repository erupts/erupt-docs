# Global Interception (PostDataProxy)

::: info
`PostDataProxy` is a global DataProxy interceptor that applies to **all** Erupt entity classes without needing to configure each `@Erupt` annotation individually.

Supported since 1.13.1+.
:::

## Execution Order

Each time a DataProxy callback is triggered, the framework executes in this order:

```
1. @PreDataProxy on annotation containers (registered via registerAnnotationContainer)
2. @PreDataProxy on parent classes / interfaces (traversed up the inheritance chain)
3. @PreDataProxy on the current class and its interfaces
4. DataProxy declared in @Erupt(dataProxy = ...)
5. PostDataProxy (globally registered, runs last)
```

`PostDataProxy` always fires **after** all local DataProxy instances — ideal for cross-cutting concerns.

## Registration

Implement `DataProxy<Object>` and call `PostDataProxy.register(...)` inside a `@PostConstruct` method:

```java
@Component
public class GlobalAuditProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(GlobalAuditProxy.class);
    }

}
```

Multiple PostDataProxy instances can be registered and are executed in registration order.

## Identifying the Current Entity Class

Inside any callback, use `DataProxyContext` to retrieve information about the entity class currently being operated on:

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
        Class<?> clazz = eruptModel.getClazz(); // e.g. Order.class
        String eruptName = eruptModel.getEruptName(); // e.g. "Order"
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

## Filtering by Annotation

Use `eruptModel.getClazz().getAnnotation(...)` to apply logic only to entities carrying a specific annotation:

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
        // Only process entities annotated with @EruptFlow
        EruptFlow eruptFlow = eruptModel.getClazz().getAnnotation(EruptFlow.class);
        if (eruptFlow == null) return;
        for (Map<String, Object> row : list) {
            row.put("flowStatus", queryFlowStatus(row.get("id")));
        }
    }

}
```

## Common Use Cases

### Global Operation Audit

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
        log("ADD", model);
    }

    @Override
    public void afterUpdate(Object model) {
        log("UPDATE", model);
    }

    @Override
    public void afterDelete(Object model) {
        log("DELETE", model);
    }

    private void log(String action, Object model) {
        String entity = DataProxyContext.get().getEruptModel().getClazz().getSimpleName();
        auditLogService.save(action, entity, model.toString());
    }

}
```

### Global Data Masking

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
                // Keep first 3 and last 4 digits, mask the middle
                row.put(PHONE_FIELD, phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
            }
        }
    }

}
```

### Global Row-Level Permission Filtering

```java
@Component
public class TenantDataProxy implements DataProxy<Object> {

    @PostConstruct
    public void init() {
        PostDataProxy.register(TenantDataProxy.class);
    }

    @Override
    public String beforeFetch(List<Condition> conditions) {
        // Inject tenant isolation condition (appended after all local DataProxy conditions)
        Long tenantId = SecurityContext.currentTenantId();
        return "tenantId = " + tenantId;
    }

}
```

:::warning
When multiple PostDataProxy instances all override `beforeFetch`, each returned condition string is independently appended as an `AND` clause by the framework — they do not override each other.
:::

## Comparison with Local DataProxy

| | `@Erupt(dataProxy = ...)` | `PostDataProxy` |
|---|---|---|
| Scope | Single entity class | All entity classes |
| Configuration | Declared on `@Erupt` annotation | `PostDataProxy.register(...)` |
| Execution order | Step 4 | Step 5 (last) |
| Typical use | Business logic, field filling, validation | Audit logging, data masking, tenant isolation |

All DataProxy callback methods are available in PostDataProxy. For the full method list, see [DataProxy Interface Definition](/en/advanced/data-proxy#dataproxy-interface-definition).
