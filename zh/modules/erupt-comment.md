# Erupt Comment 记录评论

erupt-comment 让任意 `@Erupt` 模型的每一条记录都能挂一条评论流：在记录表单面板里直接讨论、回复、置顶、标记已解决，@ 同事时发一条站内通知。评论存在服务端自己的表里，与业务表无关，不需要为模型增加任何字段。

> 最低版本要求：**2.3.0**

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-comment</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块，使用 starter-all 的项目无需再单独引入。模块依赖 `erupt-upms` 与 `erupt-data-jpa`；**@ 提及通知**依赖 [erupt-notice](/zh/modules/erupt-notice)，未引入时提及仍会被记录和高亮，只是不会有人收到通知。

引入后自动装配生效，模块通过 `registerProp("erupt-comment")` 向前端宣告自己：记录表单面板的标题栏出现**评论**入口，**系统管理** 菜单下出现 **评论记录** 菜单。

## 功能说明

![记录评论抽屉](/comment/drawer.png)

### 评论流

在表格中打开某条记录的表单面板，点击标题栏的评论图标即可展开该记录的评论流。评论按时间正序排列，每条显示作者头像、姓名与时间；能打开该模型的用户就能读写它的评论——权限沿用模型本身的菜单权限，不需要额外授权。

- 单条评论最长 4000 字符，空内容会被拒绝
- 只有作者本人（或超级管理员）可以删除自己的评论；删除一条一级评论会连带删除它的全部回复
- 引用选择器（REFERENCE_TABLE / REFERENCE_TREE 弹出的表格）里不显示评论入口

### 一级回复

评论流只有**一层**回复：对任意评论点「回复」，新评论都挂在所在话题的一级评论下，不会形成多层嵌套。这样一条记录上的讨论始终是「若干话题 + 每个话题下的回复」，读起来不会失焦。

### 置顶与已解决

话题（一级评论）带两个开关，能访问该模型的用户都可以切换：

| 开关 | 效果 |
| --- | --- |
| 置顶 Pinned | 话题排到评论流最前面，适合放结论、注意事项 |
| 已解决 Resolved | 话题折叠收起，表示讨论已闭环 |

回复不能被置顶或标记已解决，只有话题头可以。

### 表格评论计数

表格每一行的评论图标上带有该记录的评论数角标，一眼看出哪些记录有讨论。计数按当前页的记录 ID 批量查询一次（`POST /erupt-api/comment/{erupt}/counts`），不会逐行请求。

### @提及通知

输入 `@` 后按姓名搜索启用状态的用户（最多列出 20 位候选），选中后写入评论。提交时：

- 被提及的用户 ID 与姓名快照一并存入评论的 `mentions` 字段，用于在正文中高亮
- 若引入了 [erupt-notice](/zh/modules/erupt-notice)，每位被提及者收到一条站内信，标题为「**{作者} 在「{模型名}」的评论中提到了你**」，正文是评论前 200 字；通知场景 `comment_mention`（Comment Mention）在首次发送时自动创建
- 通知的跳转地址是填充布局下的表格页并带上 `?id=<主键>`，点开即定位到该记录并打开它的面板

通知发送失败不会影响评论本身的保存。

## 关闭某个模型的评论

`@Power` 新增 `comment` 属性，默认 `true`。不希望携带评论流的模型显式关闭即可：

```java
@Erupt(
    name = "登录日志",
    power = @Power(comment = false)
)
public class LoginLog extends BaseModel {

}
```

关闭后前端隐藏评论入口，服务端的新增接口同样拒绝写入。详见 [@Power → comment](/zh/annotation/power#comment-评论开关)。

## 评论记录管理

**系统管理 → 评论记录** 是全部评论的管理视图，用于审计和清理：

| 列 | 说明 |
| --- | --- |
| 模型 | 评论所属的数据模型，下拉筛选项只列出实际有评论的模型，按模型显示名展示 |
| 记录 ID | 被评论记录的主键（字符串形式，兼容任意主键类型） |
| 内容 | 评论正文，支持模糊搜索 |
| 已解决 / 置顶 | 话题头的两个标记 |
| 创建人 / 创建时间 | 评论作者与时间 |

该菜单不允许新增和编辑（评论只能在记录里写），允许删除与导出。

## erupt-cloud 节点支持

[erupt-cloud](/zh/modules/erupt-cloud) 节点上的模型同样可以评论。评论、作者与被提及的用户都属于服务端的用户体系，节点上既没有本模块也没有用户表，因此评论接口**始终留在 erupt-cloud-server 上处理**，不会被转发到节点；此时评论行以 `节点名.模型名` 为键存储，评论记录菜单里也按这个名字展示。

实现依赖 core 2.3.0 新增的 `@EruptRouter(cloudProxy = false)`：默认 `true` 表示照旧转发到节点，标为 `false` 的接口由服务端自身处理。编写需要类似行为的模块时可以复用。

## 接口

所有接口位于 `/erupt-api/comment` 下，路径第二段是模型名，鉴权方式与打开该模型的表格一致（`@EruptRouter(authIndex = 1, verifyType = ERUPT)`）：

| 接口 | 说明 |
| --- | --- |
| `GET /erupt-api/comment/{erupt}/{id}` | 某条记录的全部评论 |
| `POST /erupt-api/comment/{erupt}/counts` | 请求体为记录 ID 列表，返回每条记录的评论数 |
| `GET /erupt-api/comment/{erupt}/mention-users?keyword=` | @ 提及的候选用户，按姓名模糊匹配 |
| `POST /erupt-api/comment/{erupt}/{id}` | 新增评论，请求体 `{ content, parentId, mentions }`，`parentId` 为空即新话题，`mentions` 为用户 ID 列表 |
| `PUT /erupt-api/comment/{erupt}/{id}/{commentId}/resolved?value=` | 标记 / 取消已解决（仅话题头） |
| `PUT /erupt-api/comment/{erupt}/{id}/{commentId}/pinned?value=` | 置顶 / 取消置顶（仅话题头） |
| `DELETE /erupt-api/comment/{erupt}/{id}/{commentId}` | 删除自己的评论 |

## 数据表

模块只有一张表 `e_record_comment`，继承 `HyperModelCreatorOnlyVo`（自带 `id`、`create_by`、`create_time`），在 `(erupt, record_id)` 上建有索引：

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `erupt` | VARCHAR(100) | 模型名，云节点模型为 `节点名.模型名` |
| `record_id` | VARCHAR(100) | 记录主键的字符串形式 |
| `content` | VARCHAR(4000) | 评论正文 |
| `parent_id` | BIGINT | 所回复的话题头 ID，话题头本身为空 |
| `mentions` | VARCHAR(2000) | 被提及用户的 JSON `[{id, name}]` |
| `resolved` | BIT(1) | 已解决 |
| `pinned` | BIT(1) | 置顶 |

开启 JPA 自动建表的项目升级后自动创建；手工维护表结构的项目请按上表建表。
