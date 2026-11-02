# Erupt Revision 记录历史与回收站

erupt-revision 为任意 `@Erupt` 模型的每一条记录保留字段级的变更历史：经由 erupt 数据链路的每次新增、修改、单元格编辑、删除，都会在同一个事务里写下一条带版本号的记录，内容是「哪个字段、改前什么、改后什么」。记录面板里可以查看历史并把某次修改回滚；删除过的记录留在回收站里，随时可以恢复。历史存在模块自己的表里，不需要为业务模型增加任何字段。

> 最低版本要求：**2.4.0**

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-revision</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块，使用 starter-all 的项目无需再单独引入。模块依赖 `erupt-upms`（随之带入 `erupt-data-jpa`）。

引入后自动装配生效，模块通过 `registerProp("erupt-revision")` 向前端宣告自己：记录面板的标题栏出现**历史版本**入口，**系统管理** 菜单下出现 **记录版本** 菜单。

## 记录了什么

模块监听 core 发布的三个事件 `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`，因此凡是走 erupt 数据链路的变更都会被捕获：表单新增与修改、[单元格编辑](/zh/annotation/power#celledit-单元格编辑)、删除、导入时的批量新增，以及其它发布这些事件的模块（例如甘特图里拖动条形改日期）。监听器在调用方的事务内执行，变更与它的历史一起提交或一起回滚；写历史失败只记一条 warn 日志，绝不会把业务变更本身拖垮。

每次变更一行，`version` 从 1 起按记录递增：

| 字段 | 说明 |
| --- | --- |
| 模型 / 记录 ID | 模型名与主键的字符串形式，任意主键类型都适用 |
| 版本 | 该记录的第几次变更 |
| 操作 | `ADD` 新增、`UPDATE` 修改、`DELETE` 删除 |
| 操作人 | 操作者姓名快照，用户被删除后仍可读 |
| 变更内容 | JSON 数组 `[{field, title, before, after}]`，`title` 是变更当时的表单标题 |

`before` / `after` 的取值规则：

- 只比较 `@EruptField` 字段，逐字段 diff；`ADD` 列出所有非空字段（没有 `before`），`DELETE` 列出所有字段（没有 `after`），`UPDATE` 只列出真正变化的字段
- 值取自记录的**脱敏 JSON**，`PASSWORD` 字段永远不会落库
- 引用类字段（REFERENCE_TABLE、REFERENCE_TREE、CHECKBOX、TRANSFER、TAB_TREE、TAB_TABLE_REFER）只保存 `{主键, label}`，并且**按主键比较**：被引用行的名称改了不算本记录的变更；TAB_TABLE_ADD、MULTI_FORM、COMBINE 这类归属本记录的子行则保留完整 JSON，回滚时才能重建
- 空字符串、空数组、空对象与 `null` 视为相同，因此原样重新保存一条记录不会留下任何痕迹

:::tip
模块自己的 `EruptRecordRevision` 以及未注册为 erupt 的类不会被记录，不会出现历史套历史的情况。
:::

### 数据表

模块只有一张表 `e_record_revision`，继承 `HyperModelCreatorOnlyVo`（自带 `id`、`create_by`、`create_time`），在 `(erupt, record_id)` 上建有索引：

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `tenant_id` | VARCHAR(64) | 所属租户，平台为 `'0'`；按写入者的会话盖章，租户只能读回自己写下的历史 |
| `erupt` | VARCHAR(100) | 模型名 |
| `record_id` | VARCHAR(100) | 记录主键的字符串形式 |
| `version` | INT | 该记录的版本号 |
| `operation` | VARCHAR(64) | `ADD` / `UPDATE` / `DELETE` |
| `operator` | VARCHAR(100) | 操作人姓名快照 |
| `changes` | 大文本 | 字段级 diff 的 JSON |

开启 JPA 自动建表的项目升级后自动创建；手工维护表结构的项目请按上表建表。

## 历史抽屉与回滚

![记录历史抽屉与回滚](/revision/history.png)

在表格中打开某条记录的面板（编辑或详情均可），点击标题栏的历史图标，右侧抽屉展开该记录的时间线，最新的在最上面。每一条显示操作人头像与姓名、操作类型标签、`v` 版本号和时间，下面逐字段列出变化：

- `UPDATE`：`改前 → 改后`，空值显示为 `—`
- `ADD`：只显示写入的值
- `DELETE`：只显示删除时的值

引用字段按 `label` 显示，列表值用逗号连接，布尔值显示为是 / 否。能打开该模型的用户就能看它的历史，权限沿用模型本身的菜单权限。

### 回滚

模型拥有**编辑权限**时，每条 `UPDATE` 记录右侧带一个**回滚**链接，确认后把这次变更涉及的字段恢复为 `before` 的值。回滚走的是**常规更新链路**：校验、DataProxy 钩子、操作日志一个不少，并且本身再产生一条新的 `UPDATE` 记录（`before` / `after` 正好与被回滚的那条相反），所以回滚本身也可以再回滚。

几点约束：

- 只恢复这条记录**涉及的字段**，其它字段保持当前值。回滚一条很早的记录只撤销那一次改动，不会把整条记录倒回那个时间点
- 只有 `UPDATE` 可以回滚：`ADD` 没有「改前」，`DELETE` 请走回收站恢复
- 记录必须仍然存在，已删除的记录无法回滚
- `PASSWORD` 字段与模型中已经移除的字段会被跳过

回滚成功后表格自动重新查询。

## 回收站与恢复

**系统管理 → 记录版本** 是全部历史的管理视图，把 **操作** 筛选为 **删除** 后，它就是回收站——所有经由 erupt 删除的记录都在这里：

| 列 | 说明 |
| --- | --- |
| 模型 | 下拉筛选项只列出实际有历史的模型，按模型显示名展示；模型已经删掉的仍以原名显示 |
| 记录 ID | 被变更记录的主键 |
| 记录 | 记录的摘要：取表格里展示的前 3 个文本字段（每段最多 40 字）用 ` · ` 连接，删除记录取删除前的值，让一行读起来像一条记录而不是一个 ID；已经恢复过的删除记录带 **(已恢复)** 标记 |
| 版本 / 操作 / 操作人 | 同上 |
| 变更内容 | 字段级 diff 的 JSON，代码视图展示 |

该菜单不允许新增和编辑（历史只能由链路写入），允许删除与导出。

### 恢复

行操作 **恢复** 只在 `DELETE` 行上可用（`ifExpr = "item.operation === 'DELETE'"`），点击后用删除快照的 `before` 侧重建记录，走的是**常规新增链路**：校验、DataProxy 钩子、权限检查全部生效，恢复本身是一条新的 `ADD` 记录。

- 需要目标模型的**新增权限**
- 该记录最近一次变更必须是 `DELETE`（否则提示「该记录不在回收站中」），且记录当前不存在（否则提示「记录已存在，无需恢复」）
- 主键带 `@GeneratedValue` 的模型无法复用旧主键，记录会以**新 ID** 回来，旧 ID 下的全部历史随之迁移到新 ID，这条 `ADD` 的版本号紧接着删除记录之后继续编号；自定义主键的模型则以原 ID 恢复

:::warning
无法随记录一起回来的内容：`PASSWORD` 字段（从未保存过，恢复后为空）；引用的那一行也被删了的引用字段（先恢复被引用的记录）。
:::

:::danger
删除回收站里的一行就是表格的常规删除：对 `DELETE` 记录而言，它是被删记录仅存的副本，删掉后记录**永久离开回收站**；删除其它类型的行只是修剪历史。
:::

## 按模型关闭

`@Power` 新增 `revision` 属性，默认 `true`。不需要历史的模型（比如高频写入的日志表）显式关闭即可：

```java
@Erupt(
    name = "登录日志",
    power = @Power(revision = false)
)
public class LoginLog extends BaseModel {

}
```

关闭后服务端不再捕获该模型的变更，前端也隐藏历史入口。详见 [@Power](/zh/annotation/power)。

## 接口

所有接口位于 `/erupt-api/revision` 下，路径第二段是模型名，鉴权方式与打开该模型的表格一致（`@EruptRouter(authIndex = 1, verifyType = ERUPT, cloudProxy = false)`）：

| 接口 | 说明 |
| --- | --- |
| `GET /erupt-api/revision/{erupt}/{id}` | 某条记录的全部历史，按版本倒序；每项为 `{ id, version, operation, createTime, userId, userName, userAvatar, changes }` |
| `POST /erupt-api/revision/{erupt}/{id}/{revisionId}/rollback` | 回滚某条 `UPDATE` 记录，需要模型的编辑权限 |
| `POST /erupt-api/revision/{erupt}/{id}/restore` | 从回收站恢复记录，需要模型的新增权限；返回恢复后的主键（可能是新的） |

`changes` 里的 `before` / `after` 按原样返回：引用字段是 `{主键, label}`，缺省的一侧为 `null`。
