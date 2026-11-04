# 权限控制 @Power

`@Power` 注解用于精细化控制 Erupt 界面的增、删、改、查、导入、导出等功能的启用状态。

> 控制 erupt 类能力，包括：新增、修改、删除、导入、导出等

## 使用方法

```java
@Erupt(
       name = "Erupt",
       power = @Power(add = true, delete = true, 
                      edit = true, query = true, 
                      importable = false, export = true)
)
public class EruptTest extends BaseModel {
    
}
```

## 注解属性说明

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `add` | boolean | true | 是否允许新增数据 |
| `delete` | boolean | true | 是否允许删除数据 |
| `edit` | boolean | true | 是否允许编辑数据 |
| `query` | boolean | true | 输入查询功能 |
| `viewDetails` | boolean | true | 是否允许查看详情 |
| `export` | boolean | true | 是否允许导出数据（2.4.0 起默认开启） |
| `importable` | boolean | false | 是否允许导入数据 |
| `print` | boolean | true | 是否允许打印行数据（1.14.1+） |
| `copy` | boolean | true | 是否允许一键复制行数据（2.0.0+） |
| `cellEdit` | boolean | true | 是否允许在表格中直接编辑单元格（2.2.0+） |
| `batchEdit` | boolean | true | 是否允许批量编辑：一次把多行的同一字段改为同一值（2.4.0+） |
| `ai` | boolean | true | AI 工具是否可以检视和操作该模型（2.1.0+） |
| `comment` | boolean | true | 是否允许该模型的记录携带评论流，需引入 erupt-comment（2.3.0+） |
| `revision` | boolean | true | 是否记录该模型的字段级变更历史并支持回滚，需引入 erupt-revision（2.4.0+） |
| `powerHandler` | Class | - | 实现此接口动态控制权限 |

## 配置项注解定义

```java
public @interface Power {
    boolean add() default true; // 数据新增功能

    boolean delete() default true; // 数据删除功能

    boolean edit() default true; // 数据修改功能

    boolean query() default true; // 输入查询功能

    boolean viewDetails() default true; // 数据查看功能

    // 数据导出功能，2.4.0 起默认开启；谁能导出由角色的 EXPORT 按钮决定，列可用 @View(export = false) 排除
    boolean export() default true;

    boolean importable() default false; // 数据导入功能

    boolean print() default true; // 数据打印功能（1.14.1+）

    boolean copy() default true; // 一键复制行数据（2.0.0+）

    // 表格内单元格编辑（2.2.0+）
    boolean cellEdit() default true;

    // 批量编辑：把多行的同一字段一次改为同一值，每行都走单元格编辑链路（2.4.0+）
    boolean batchEdit() default true;

    // AI 工具是否可以检视和操作该模型（2.1.0+）
    boolean ai() default true;

    // 记录是否携带评论流，需引入 erupt-comment 模块（2.3.0+）
    boolean comment() default true;

    // 是否保留字段级变更历史并支持回滚，需引入 erupt-revision 模块（2.4.0+）
    boolean revision() default true;

    // 实现此接口动态控制权限
    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

```java
public interface PowerHandler {

    /**
     * 动态控制各功能使用权限
     * @param power 增删改查等功能的简单 pojo 对象
     */
    void handler(PowerObject power);

}
```

## export 导出默认开启 <Badge type="tip" text="v2.4.0+" />

2.4.0 起 `export` **默认为 `true`**，与 `add` / `edit` / `delete` / `viewDetails` 一样不再需要逐个模型打开，**谁能导出由角色菜单上的 EXPORT 按钮决定**。

- 要让某一列不进入导出文件，用 `@View(export = false)`，模型级 `export` 仍然开着
- `importable` 仍是选择性开启，导入入口需要显式 `@Power(importable = true)`
- 此后新建的菜单自动带上 EXPORT 按钮；**已有菜单保持原样**，没有授权过导出的角色需要手动勾选

```java
// 敏感数据不允许整表导出
@Erupt(name = "薪资", power = @Power(export = false))
```

## print 打印权限 <Badge type="tip" text="v1.14.1+" />

`print` 控制表格行的**打印**入口是否可用，默认开启。若模型不需要打印能力，可显式关闭：

```java
@Erupt(name = "示例", power = @Power(print = false))
```

:::info print 只是模型开关，不是读取记录的授权
`print` 不单独授予读取某条记录的权限：详情接口要求 `edit` 或 `viewDetails` 之一；模板打印要求 `print && (edit || viewDetails)`，并且记录必须落在当前用户的行数据范围内。
:::

## batchEdit 批量编辑 <Badge type="tip" text="v2.4.0+" />

`batchEdit` 控制表格工具栏是否提供**批量编辑**按钮，默认 `true`。勾选多行后点击它，可把这些行的**同一个字段**一次设为同一个值，写入走 `POST /erupt-api/data/modify/{erupt}/update-cells`。

它建立在单元格编辑之上，**每一行都完整跑一遍单元格编辑链路**：

- 字段是否允许单元格编辑（`@Edit(cellEdit = false)` 的字段同样不参与批量编辑）
- 整行校验、行数据权限
- `DataProxy` 的 `beforeUpdate` / `afterUpdate`
- 操作日志与编辑事件

**任意一行被拒绝，整批回滚**，不会出现一半行改了、一半行没改的情况。

```java
// 行只能逐条审阅后修改，关闭批量编辑但保留单元格编辑
@Erupt(name = "结算单", power = @Power(batchEdit = false))
```

:::tip
`batchEdit` 在服务端校验：关闭后即使直接构造多行更新请求也会被拒绝。按钮同时要求 `edit` 权限，任一关闭则不出现。
:::

## revision 变更历史 <Badge type="tip" text="v2.4.0+" />

`revision` 控制该模型的记录变更是否被记录为**字段级历史**并支持回滚，默认 `true`。只有引入了 [erupt-revision](/zh/modules/erupt-revision) 模块时才有意义。

```java
// 高频写入的日志类模型没有必要留历史
@Erupt(name = "访问日志", power = @Power(revision = false))
```

## ai AI 访问开关 <Badge type="tip" text="v2.1.0+" />

`ai` 控制 **AI 工具能否检视和操作该 erupt 模型**，默认 `true`。

:::warning 这是角色授权之上的一道硬闸
`ai` 是**模型级**开关，优先级高于任何角色/菜单授权：一旦在 `@Erupt` 上设置 `ai = false`，无论某个角色被授予了多少 AI Tool 权限、无论当前用户是否为超级管理员，AI 都无法通过工具读取或修改该模型的数据。
:::

它的生效点在 `erupt-ai-claw` 的 Erupt 模型工具集中：

- **模型列表**：`eruptModelList` 会直接跳过 `power().ai() == false` 的模型，AI 甚至「看不见」它的存在
- **单模型访问**：`eruptSchema` / `eruptDataQuery` / `findEruptDataByPk` / `insertEruptData` / `updateEruptData` / `deleteEruptData` 在执行前统一走同一个前置校验，命中 `ai = false` 时直接抛出 `AI access is disabled for this Erupt model: xxx`，且该判断发生在超级管理员放行分支**之前**

```java
// 敏感模型：允许人在后台操作，但禁止 AI 触碰
@Erupt(
    name = "用户账号",
    power = @Power(ai = false)
)
public class SensitiveModel extends BaseModel {

}
```

对于需要 AI 可访问的模型，除了保持 `ai = true`，仍需满足常规权限链路：当前用户拥有该模型的菜单权限，且 `@Power` 中对应的 `query` / `add` / `edit` / `delete` 已开启。

:::tip
`erupt-cloud` 远程节点上的 erupt 没有本地注解，`ai` 开关对其不生效，权限判定由所属节点自行完成。
:::

## cellEdit 单元格编辑 <Badge type="tip" text="v2.2.0+" />

`cellEdit` 控制表格是否支持**行内单元格编辑**，默认 `true`。

开启后，双击单元格（或点击单元格上的编辑图标）即可修改单个字段，无需打开行表单。浮层里用的就是行表单同一套 `erupt-edit-type` 组件，因此值转换、校验、引用选择器的行为完全一致，写入走单字段更新接口 `POST /erupt-api/data/modify/{erupt}/update-cell`。

```java
// 该表格的行数据必须整体审阅后修改，关闭单元格编辑
@Erupt(name = "结算单", power = @Power(cellEdit = false))
```

### 一次单元格提交会跑完整条编辑链路

服务端把库中原始行序列化出来、打上新值，再**按整行校验**——与表单提交调用的是同一个方法。因此：

- 每个字段的校验规则都会参与，跨字段的不变式不会被逐格改写绕过
- 读取其他字段的 [@Dynamic](/zh/annotation/dynamic) 规则可以正常解析
- `DataProxy` 的 `beforeUpdate` / `afterUpdate` 拿到的是完整实体
- 操作日志与编辑事件与表单提交一致

### 两级开关，服务端都校验

| 层级 | 开关 | 默认值 |
| --- | --- | --- |
| 模型 | `@Erupt(power = @Power(cellEdit = false))` | `true` |
| 字段 | `@Edit(cellEdit = false)` | `true` |

两个开关都在写入端校验：即使构造请求直接调用单字段更新接口，关闭了单元格编辑的模型与字段同样会被拒绝。

字段级开关适用于「表单里可以改、但不该在表格浮层里随手改」的字段——典型的是决定身份与访问权的值。框架自身即按此原则关闭了：用户的账号、管理员标记、角色、组织范围、有效期、IP 白名单与状态，角色的编码与状态，Open API 的密钥、有效期与状态，LLM / 嵌入模型的 API 域名，Agent 地址，以及 BI 数据源的连接串。

```java
@EruptField(
    views = @View(title = "状态"),
    // 状态只能通过工作流流转，不允许在表格里直接改
    edit = @Edit(title = "状态", type = EditType.CHOICE, cellEdit = false)
)
private String status;
```

:::warning afterFetch 改写过的字段
单元格编辑器的初始值取自表格查询返回的那一行。如果 `DataProxy.afterFetch` 为了展示而改写了某个字段（脱敏、格式化、拼成 HTML），这个「展示值」会被原样写回。请只改写只读字段，或给可编辑字段加上 `@Edit(cellEdit = false)`。
:::

:::tip
单元格编辑不会放开任何新入口：表格本身仍需 `edit` 权限，树形菜单与子表没有表格可点，集合类字段（多对多等）因列表查询不返回其值而不参与单元格编辑。
:::

## comment 评论开关 <Badge type="tip" text="v2.3.0+" />

`comment` 控制该模型的记录是否携带**评论流**，默认 `true`。只有引入了 [erupt-comment](/zh/modules/erupt-comment) 模块时才有意义：模块存在时，记录表单面板的标题栏出现评论入口，表格行上显示评论计数。

```java
// 日志类模型没有讨论的必要，关闭评论
@Erupt(name = "登录日志", power = @Power(comment = false))
```

关闭后前端隐藏评论入口，服务端的新增评论接口同样拒绝写入；评论的读写权限本身沿用模型的菜单权限，不需要额外授权。

## 注意事项

用户访问时同时检查**菜单权限**与注解值，开启 power 后，如果不显示，需要检查菜单权限是否完整，如果缺少菜单权限需手动添加。
