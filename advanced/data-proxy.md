# 数据代理（DataProxy）

`DataProxy` 是 Erupt 最核心的扩展机制，通过实现 `DataProxy<T>` 接口可以在数据的增删改查各个生命周期插入自定义逻辑。

## 生命周期钩子

| 方法 | 时机 |
|------|------|
| `beforeAdd` | 新增前 |
| `afterAdd` | 新增后 |
| `beforeUpdate` | 编辑前 |
| `afterUpdate` | 编辑后 |
| `beforeDelete` | 删除前 |
| `afterDelete` | 删除后 |
| `beforeFetch` | 查询前（可修改查询条件）|

## 示例

```java
@Service
public class ProductProxy implements DataProxy<Product> {

    @Override
    public void beforeAdd(Product product) {
        product.setCreateTime(new Date());
    }

    @Override
    public void beforeDelete(Product product) {
        if (product.getStatus() == 1) {
            throw new EruptApiErrorTip("上架中的商品不可删除");
        }
    }
}
```

在 `@Erupt` 注解中注册：

```java
@Erupt(name = "商品管理", dataProxy = { ProductProxy.class })
```

::: tip
占位文档，更多用法待补充。
:::
