# Erupt Memory In-Memory Data Source

The erupt-data-memory module provides a writable in-memory data source. Data lives for the lifetime of the process, stored in a `ConcurrentHashMap` keyed by the model's primary key. It suits prototyping, testing, runtime-registered dynamic models, and demos — full CRUD out of the box, and the fastest way to get an Erupt admin page running: no database setup required at all.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-memory</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Usage

Extend `EruptMemoryRepository<T>` and register it as a Spring bean, then reference the registered data processor identifier via `@EruptDataProcessor`:

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

## Primary Key Generation Rules

When the primary key is empty on add, it is generated automatically:

- `Long` / `long` / `Integer` / `int` types: an incrementing sequence
- Other types: `UUID.randomUUID().toString()`

If you need stable, business-meaningful IDs, provide them yourself when adding.

## Supported Operations

Full CRUD: list / detail / add / edit / delete. Filtering, sorting, and pagination are evaluated in memory by the base class, with semantics identical to the persistent implementations — you can prototype on the memory data source first, then switch to JPA / MongoDB without changing a single annotation.

:::tip
Data lives only inside the process and is lost on restart — never use this as persistent storage in production.
:::
