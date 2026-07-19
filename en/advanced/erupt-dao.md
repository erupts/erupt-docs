# EruptDao Overview

`EruptDao` is a utility class built on top of Spring Data JPA that helps you work with Erupt entities to manage data programmatically — **equivalent to the DAO layer in traditional development**.

Detailed usage for each capability is covered in the other documents of this group:

- [Chained Queries (LambdaQuery)](/en/advanced/erupt-dao-lambda): strongly-typed lambda queries, aggregation, pagination, association queries
- [Multi-Datasource Operations (getEntityManager)](/en/advanced/erupt-dao-datasource): run queries against a specific data source

## Basic Usage

```java
@Service
public class EruptJdbc {

    @Resource
    private EruptDao eruptDao;

    // Query using lambda (lambdaQuery supported since 1.12.11+)
    public void query() {
        List<Student> students = eruptDao.lambdaQuery(EruptUser.class)
            .in(EruptUser::getId, 1, 2, 3, 4)
            .ge(EruptUser::getCreateTime, "2023-01-01")
            .isNull(EruptUser::getWhiteIp)
            .list();
    }

    // Native SQL query
    public void nativeQuery(Goods goods) {
        List<Map<String, Object>> list = eruptDao.getJdbcTemplate()
            .queryForList("select * from t_table");
    }

    // Find by ID
    public void findById(Long id) {
        Student student = eruptDao.findById(Student.class, id);
    }

    // Add
    @Transactional // Note: @Transactional is required
    public void add(Student student) {
        eruptDao.persist(student);
        // flush syncs pending operations in the current transaction to the database immediately (without committing)
        // In bulk operations, call flush every 500–1000 records to prevent OOM from accumulating too many changes
        eruptDao.flush();
    }

    // Update
    @Transactional // Note: @Transactional is required
    public void modify(Student student) {
        student.setName("xxx");
        eruptDao.merge(student);
    }

    // Delete
    @Transactional // Note: @Transactional is required
    public void delete(Student student) {
        eruptDao.delete(student);
    }
}
```

## MyBatis

Erupt classes natively support LambdaQuery, dynamic table creation, and join queries — capabilities that fully replace what MyBatis Plus provides. Do not introduce both.

If your service requires complex SQL with XML-based dynamic assembly, you may introduce MyBatis for those cases. MyBatis is a JDBC tool; JPA is an ORM tool — they can coexist without any conflict.
