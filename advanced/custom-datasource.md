# 自定义数据源

如果你希望用 Erupt 管理数据库以外的数据，可以使用自定义数据源的方式实现。

## 使用场景

- 外部 API 接口的显示与处理（HTTP、Dubbo）
- CSV、TSV 等数据文件的可视化管理
- 对接其他外部数据源，如 ES、MongoDB

## 使用方法

### 1. 实现 IEruptDataService 接口

```java
public interface IEruptDataService {

    /**
     * 全局控制数据源内功能操作能力（1.12.12 及以上版本支持）
     * 如当前数据源无删除和新增能力，在此控制即可，无需在 @Erupt → @Power 处再次声明
     */
    default PowerObject power() {
        return new PowerObject();
    }

    /** 根据主键 id 获取数据 */
    Object findDataById(EruptModel eruptModel, Object id);

    /** 查询分页数据 */
    Page queryList(EruptModel eruptModel, Page page, EruptQuery eruptQuery);

    /** 根据列查询相关数据 */
    Collection<Map<String, Object>> queryColumn(EruptModel eruptModel, List<Column> columns, EruptQuery eruptQuery);

    /** 新增数据 */
    void addData(EruptModel eruptModel, Object object);

    /** 修改数据 */
    void editData(EruptModel eruptModel, Object object);

    /** 删除数据 */
    void deleteData(EruptModel eruptModel, Object object);

}
```

### 2. 注册自定义数据源

```java
// 可在 static 块或 Spring 生命周期函数中注册
DataProcessorManager.register("数据源名称", EruptDataServiceImpl.class);
```

### 3. 在 Erupt 类上添加 @EruptDataProcessor 注解

```java
@EruptDataProcessor("已注册数据源名称")
@Erupt(name = "xxxx")
public class Test {

}
```
