# PostDataProxy Global Interceptor

::: info
Intercepts data operations across all Erupt classes, including: export, query, add, update, and delete.

Supported since 1.13.1+.
:::

```java
@Component
public class FlowPostDataProxy implements DataProxy<Object> {

    @Resource
    private EruptDao eruptDao;

    // Register the global interceptor
    @PostConstruct
    public void post() {
        PostDataProxy.register(FlowPostDataProxy.class);
    }

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        EruptModel eruptModel = DataProxyContext.get().getEruptModel();
        for (Annotation annotation : eruptModel.getClazz().getDeclaredAnnotations()) {
            if (EruptFlow.class == annotation.annotationType()) {
                // TODO
            }
        }
    }

}
```

For other callback methods, refer to the [DataProxy Interface Definition](/en/advanced/data-proxy#dataproxy-interface-definition).
