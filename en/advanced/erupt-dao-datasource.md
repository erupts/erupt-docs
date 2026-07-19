# Multi-Datasource Operations (getEntityManager)

Use `eruptDao.getEntityManager("datasource-name")` to obtain the `EntityManager` of a specific data source and run queries against it. See [Multiple Data Sources](/en/advanced/datasource) for datasource configuration.

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    public void dbs() {
        EntityManager entityManager = eruptDao.getEntityManager("datasource-name");

        // Supported since 1.12.13+
        eruptDao.lambdaQuery(entityManager, EruptUser.class)
            .like(EruptUser::getName, "e")
            .min(EruptUser::getCreateTime);

        // Note: When operating on multiple data sources, you must close the EntityManager manually.
        // Forgetting to call close() will prevent the connection from being returned to the pool,
        // eventually exhausting all connections and throwing a connection timeout exception.
        entityManager.close();
    }
}
```

:::warning
When operating on multiple data sources, always call `entityManager.close()` manually — otherwise connections are never returned to the pool and will eventually be exhausted.
:::
