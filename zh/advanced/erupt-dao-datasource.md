# 多数据源操作（getEntityManager）

通过 `eruptDao.getEntityManager("数据源名称")` 获取指定数据源的 `EntityManager`，即可在该数据源上执行查询。数据源的配置方式见[多数据源](/zh/advanced/datasource)。

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    public void dbs() {
        EntityManager entityManager = eruptDao.getEntityManager("数据源名称");

        // 1.12.13 及以上版本支持
        eruptDao.lambdaQuery(entityManager, EruptUser.class)
            .like(EruptUser::getName, "e")
            .min(EruptUser::getCreateTime);

        // 注意：多数据源操作时必须手动关闭 EntityManager
        // 忘记调用会导致该数据源的数据库连接无法归还连接池，最终耗尽所有连接并抛出连接超时异常
        entityManager.close();
    }
}
```

:::warning
多数据源操作时必须手动调用 `entityManager.close()`，否则连接无法归还连接池，最终导致连接耗尽。
:::
