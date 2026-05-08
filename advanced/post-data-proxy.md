# PostDataProxy 全局拦截

::: info
拦截所有 erupt 类的数据行为，包括：导出、查询、新增、修改、删除等

1.13.1 及以上版本支持
:::

```java
@Component
public class FlowPostDataProxy implements DataProxy<Object> {

    @Resource
    private EruptDao eruptDao;

    // 注册全局拦截器
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

其他回调方法参考 [DataProxy 接口定义](/advanced/data-proxy#dataproxy-接口定义)。
