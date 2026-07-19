# EruptDao 概览

EruptDao 是基于 Spring Data JPA 实现的一个工具类，帮助您复用 erupt 对象，实现数据管理，**相当于传统开发中的 DAO 层**。

各能力的详细用法见本分组下的其他文档：

- [链式查询（LambdaQuery）](/zh/advanced/erupt-dao-lambda)：lambda 强类型查询、聚合、分页、关联查询
- [多数据源操作（getEntityManager）](/zh/advanced/erupt-dao-datasource)：在指定数据源上执行查询

## 基础使用

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // 通过对象查询
    // lambdaQuery 1.12.11 及以上版本支持
    public void query() {
        List<Student> students = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .list();
    }

    // 原生 sql 查询
    public void nativeQuery(Goods goods) {
        List<Map<String, Object>> list = eruptDao.getJdbcTemplate()
            .queryForList("select * from t_table");
    }

    // 通过 id 获取数据
    public void findById(Long id) {
        Student student = eruptDao.findById(Student.class, id);
    }

    // 新增
    @Transactional // 注意：需添加事务注解
    public void add(Student student) {
        eruptDao.persist(student);
        // flush 将当前事务中的挂起操作立即同步到数据库（不提交事务）
        // 批量操作时建议每 500~1000 次调用一次，防止内存中积压过多变更导致 OOM
        eruptDao.flush();
    }

    // 修改
    @Transactional // 注意：需添加事务注解
    public void modify(Student student) {
        student.setName("xxx");
        eruptDao.merge(student);
    }

    // 删除
    @Transactional // 注意：需添加事务注解
    public void delete(Student student) {
        eruptDao.delete(student);
    }
}
```

## MyBatis

Erupt 类同时支持 LambdaQuery 查询 + 动态建表能力 + Join Query，mybatis plus 的能力可以通过 EruptLambdaQuery 完全代替，请勿重复引入。

如果你的服务中需要复杂的 SQL 定义，可以引入 MyBatis 执行复杂的 XML 拼接。MyBatis 是一个 jdbc 工具，JPA 是 ORM 工具，共存不会有任何问题。
