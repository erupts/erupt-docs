# erupt-designer 可视化表单设计器

在运行时通过拖拽方式可视化设计 Erupt 实体模型，发布后自动注册为数据管理菜单，无需重启服务。设计结果可一键导出为 Java 注解代码，平滑过渡到手写开发。

> **2.0.0 及以上版本支持**

![erupt-designer](/erupt-designer/designer.png)

## 引入依赖

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-designer</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## 工作流程

```
创建模型条目 → 进入设计器 → 拖拽配置字段 → 实时预览 → 一键发布 → 菜单生效
```

1. 进入 **Form Designer** 菜单，新建一条模型记录，填写类名（Class Name）和名称。
2. 点击行按钮 **Design**，进入可视化设计器。
3. 在设计器中拖拽添加字段，配置字段类型、标题、必填、搜索等属性。
4. 点击 **Preview** 实时预览表单效果。
5. 回到列表页点击行按钮 **Add to Menu**，配置菜单位置，一键发布到系统菜单。
6. 无需重启服务，菜单立即生效。

## 导出 Java 代码

在设计器中点击 **Export Code** 可生成标准 Java 注解代码：

```java
@Erupt(name = "我的模型")
public class MyModel extends BaseModel {

    @EruptField(
        views = @View(title = "名称"),
        edit  = @Edit(title = "名称", notNull = true)
    )
    private String name;

    // ...
}
```

导出后可将代码放入项目源码中，替换掉 designer 管理的运行时模型，实现"设计 → 开发"的平滑过渡。

## 发布机制

- 发布后，设计配置保存到 `e_designer.config`，并在内存中注册为运行时 `EruptModel`。
- 每次服务启动时，所有已发布的设计模型会自动重新注册，无需手动操作。
- 若同名的真实 `@Erupt` 类已存在，设计器无法覆盖，避免冲突。

## 数据存储 <Badge type="tip" text="v2.2.0+" />

2.2.0 起，设计器模型的**业务数据**存放在一个内嵌 SQLite 文件中，每个已发布的设计对应其中一张真实表（表名 `d_<类名小写>`）：

```yaml
erupt:
  designer:
    # SQLite 文件路径，相对路径相对 JVM 工作目录解析
    db-path: data/designer.db
    # 连接池大小；SQLite 同一时刻只允许一个写入者，WAL 模式下读取可并发
    max-pool-size: 4
```

这样标量字段落成原生列，过滤、排序、分页都下推为 SQL，且不受宿主项目用的是哪种数据库影响。引用与多值字段保留复合值，以 JSON 文本存储，用 `json_extract` / `json_each` 检索。

表结构变更是**只增不减**且幂等的：只新增列，不删除、不改类型；字段重命名会按发布时分配的字段 id 移动原列，使已有数据跟着新名字走，而不是滞留在旧列中。

:::warning 该文件不在主数据库里
`designer.db` 是独立文件，请挂载到持久化卷并纳入备份，否则容器重建后设计器数据会丢失。
:::

:::info 从 2.1.x 升级
旧版数据保存在主库的 `e_designer_data` 表中，2.2.0 **不会自动迁移**。升级后重新发布设计即可得到新表结构；如需保留历史数据，请从 `e_designer_data` 中导出 JSON 后重新导入。

该表升级后不再被读写，Hibernate 也不会自动删除，确认数据无用后可手动 `DROP TABLE e_designer_data`。设计配置本身（`e_designer`）仍在使用，不受影响。
:::

## 注意事项

- 字段类型支持：`INPUT`、`TEXTAREA`、`NUMBER`、`DATE`、`BOOLEAN`、`CHOICE`、`MULTI_CHOICE`、`SLIDER`、`RATE`、`COLOR`、`REFERENCE_TREE`、`REFERENCE_TABLE` 等常用类型。
- 关联字段（`REFERENCE_*`）需要关联到已存在的 Erupt 模型。
