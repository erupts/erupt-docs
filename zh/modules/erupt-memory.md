# Erupt Memory 内存数据源

erupt-data-memory 模块提供可写的内存数据源。数据存活于进程生命周期内，以模型主键为键存储在 `ConcurrentHashMap` 中。适用于原型验证、测试、运行时注册的动态模型和演示场景——开箱即用的完整 CRUD，也是"最快跑通一个 Erupt 管理页"的方式：无需搭建任何数据库。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-memory</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 使用方式

继承 `EruptMemoryRepository<T>` 并注册为 Spring Bean，再通过 `@EruptDataProcessor` 引用注册的数据处理器标识：

```java
@Service
public class TaskRepository extends EruptMemoryRepository<Task> {
    public static final String DATA_PROCESSOR = "MEMORY_TASK";
    static { DataProcessorManager.register(DATA_PROCESSOR, TaskRepository.class); }
}

@Getter
@Setter
@Erupt(name = "任务", primaryKeyCol = "id")
@EruptDataProcessor(TaskRepository.DATA_PROCESSOR)
public class Task {

    @EruptField(views = @View(title = "ID"))
    private Long id;

    @EruptField(
        views = @View(title = "标题"),
        edit = @Edit(title = "标题", notNull = true, search = @Search)
    )
    private String title;

    @EruptField(
        views = @View(title = "已完成"),
        edit = @Edit(title = "已完成", type = EditType.BOOLEAN)
    )
    private Boolean done;
}
```

## 主键生成规则

新增时主键为空则自动生成：

- `Long` / `long` / `Integer` / `int` 类型：递增序列
- 其他类型：`UUID.randomUUID().toString()`

如需稳定、有业务含义的 ID，请在新增时自行提供。

## 操作支持

完整 CRUD：列表 / 详情 / 新增 / 修改 / 删除。筛选、排序、分页由基类在内存中求值，语义与持久化实现完全一致——可以先用内存数据源做原型，之后切换到 JPA / MongoDB 而无需改动任何注解。

:::tip
数据仅存活于进程内，重启即丢失，请勿用作生产环境的持久存储。
:::
