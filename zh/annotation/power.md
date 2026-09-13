# 权限控制 @Power

`@Power` 注解用于精细化控制 Erupt 界面的增、删、改、查、导入、导出等功能的启用状态。

> 控制 erupt 类能力，包括：新增、修改、删除、导入、导出等

## 使用方法

```java
@Erupt(
       name = "Erupt",
       power = @Power(add = true, delete = true, 
                      edit = true, query = true, 
                      importable = false, export = false)
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
| `export` | boolean | false | 是否允许导出数据 |
| `importable` | boolean | false | 是否允许导入数据 |
| `print` | boolean | true | 是否允许打印行数据（1.14.1+） |
| `copy` | boolean | true | 是否允许一键复制行数据（2.0.0+） |
| `cellEdit` | boolean | true | 是否允许在表格中直接编辑单元格（2.2.0+） |
| `ai` | boolean | true | AI 工具是否可以检视和操作该模型（2.1.0+） |
| `powerHandler` | Class | - | 实现此接口动态控制权限 |

## 配置项注解定义

```java
public @interface Power {
    boolean add() default true; // 数据新增功能

    boolean delete() default true; // 数据删除功能

    boolean edit() default true; // 数据修改功能

    boolean query() default true; // 输入查询功能

    boolean viewDetails() default true; // 数据查看功能

    boolean export() default false; // 数据导出功能

    boolean importable() default false; // 数据导入功能

    boolean print() default true; // 数据打印功能（1.14.1+）

    boolean copy() default true; // 一键复制行数据（2.0.0+）

    // 表格内单元格编辑（2.2.0+）
    boolean cellEdit() default true;

    // AI 工具是否可以检视和操作该模型（2.1.0+）
    boolean ai() default true;

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

## print 打印权限 <Badge type="tip" text="v1.14.1+" />

`print` 控制表格行的**打印**入口是否可用，默认开启。若模型不需要打印能力，可显式关闭：

```java
@Erupt(name = "示例", power = @Power(print = false))
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

## 注意事项

用户访问时同时检查**菜单权限**与注解值，开启 power 后，如果不显示，需要检查菜单权限是否完整，如果缺少菜单权限需手动添加。
