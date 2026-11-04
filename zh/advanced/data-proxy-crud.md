# CRUD 拦截（before* / after*）

在新增、修改、删除操作的前后注入业务逻辑：`before*` 方法在数据持久化前触发，可修改数据或中止操作；`after*` 方法在持久化成功后触发，适合写缓存、推送消息等副作用操作。

## 钩子方法

| 方法 | 触发时机 | 典型用途 |
| --- | --- | --- |
| `beforeAdd(MODEL)` | 新增保存前 | 补充默认值、调用外部服务 |
| `afterAdd(MODEL)` | 新增保存后 | 写缓存、消息推送 |
| `beforeUpdate(MODEL)` | 修改保存前 | 动态改写数据 |
| `afterUpdate(MODEL)` | 修改保存后 | 同步下游系统 |
| `beforeDelete(MODEL)` | 删除前 | 关联数据检查，可中止删除 |
| `afterDelete(MODEL)` | 删除后 | 清理关联资源 |

> 纯校验逻辑建议放在 `validate` 中，详见[表单校验（validate）](/zh/advanced/data-proxy-validate)。

## 代码示例

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void beforeAdd(EruptTest eruptTest) {
        // 保存前补充数据
        eruptTest.setCreateBy(getCurrentUser());
    }

    @Override
    public void beforeUpdate(EruptTest eruptTest) {
        // 动态写数据
        eruptTest.setName(eruptTest.getName() + "xxxxxxx");
    }

    @Override
    public void beforeDelete(EruptTest eruptTest) {
        // 删除前检查，抛出异常可中止操作
        if (hasRelatedOrder(eruptTest.getId())) {
            throw new EruptApiErrorTip("存在关联订单，禁止删除");
        }
    }

    @Override
    public void afterAdd(EruptTest eruptTest) {
        // 新增成功后推送消息、写缓存等
    }

}
```

:::tip
在任意 `before*` 方法中抛出 `EruptApiErrorTip`（或 `EruptException`）即可中止本次操作，并将错误信息提示给用户。
:::
