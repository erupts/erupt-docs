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

## 注意事项

- 设计器模型的数据存储在 `e_designer_data` 表中，不会自动建表（DDL 由 `ddl-auto` 控制）。
- 字段类型支持：`INPUT`、`TEXTAREA`、`NUMBER`、`DATE`、`BOOLEAN`、`CHOICE`、`MULTI_CHOICE`、`SLIDER`、`RATE`、`COLOR`、`REFERENCE_TREE`、`REFERENCE_TABLE` 等常用类型。
- 关联字段（`REFERENCE_*`）需要关联到已存在的 Erupt 模型。
