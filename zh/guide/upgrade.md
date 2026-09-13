# 升级指南

本文档按版本说明 Erupt 升级时需要注意的事项，请按版本顺序依次阅读。

## V 2.2.0 升级指南

本节说明从 2.1.x 升级到 2.2.0 时需要注意的事项。

### 升级要求

| 项目 | 要求 |
| --- | --- |
| Erupt | 全部依赖统一升级至 `2.2.0` |
| Spring Boot | **3.5.16**，与 2.1.x 相同，无需调整 |
| JDK | 最低 **JDK 17**，无变化 |
| 数据库 | 无最低版本变化；表结构变更见下文 |
| erupt-cloud-node | 使用了 [erupt-cloud-node](/zh/modules/cloud-node) 的项目，**节点服务必须同步升级至 2.2.0** |

### 第一步：修改依赖版本

项目通常用一个属性统一管理版本号，改这一处即可：

```xml
<properties>
    <erupt.version>2.2.0</erupt.version>
</properties>
```

未使用统一属性时，请把 `pom.xml` 中所有 `xyz.erupt` 坐标的 `<version>` 一并改为 `2.2.0`——框架内部模块之间按同版本装配，混用版本会在启动时报错。

:::tip
使用 [erupt-spring-boot-starter](/zh/guide/quick-start) 或 `erupt-spring-boot-starter-all` 的项目，子模块版本由启动器统一管理，只需改启动器自身的版本号。
:::

本次升级**没有** artifactId 重命名或模块下线，2.1.x 的依赖坐标可直接沿用。

### 第二步：按需引入新模块（可选）

2.2.0 新开源两个模块，不引入不会有任何影响；引入后首次启动自动初始化菜单，无需手工建菜单：

| 模块 | artifactId | 用途 |
| --- | --- | --- |
| [模型图谱](/zh/modules/erupt-atlas) | `erupt-atlas` | 模型关系图、血缘追溯、耦合矩阵、结构审计，以及自 erupt-monitor 迁入的 Erupt 类注册表 |
| [远程访问](/zh/modules/erupt-remote) | `erupt-remote` | 浏览器内 VNC 桌面与 SSH 终端 |

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-atlas</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

:::warning erupt-remote 需要额外配置
多节点部署必须为每个节点配置相同的 `erupt.remote.secret-key`，否则一个节点加密的主机凭据在另一个节点上无法解密。反向代理还需为 `/erupt-remote` 转发 WebSocket 升级请求，详见[模块文档](/zh/modules/erupt-remote#nginx-反向代理)。
:::

### 破坏性变更

#### 1. 用户与角色列表不再按创建人过滤 <Badge type="warning" text="访问面扩大" />

**影响范围**：给非管理员用户授予了「用户管理」或「角色管理」菜单的系统。

2.1.x 中 `EruptUser` 从 `LookerSelf` 继承了一条 `@PreDataProxy`，`EruptRoleDataProxy` 中也有同样的内联规则：`isAdmin` 为 false 的用户只能看到 `createUser` 是自己的行。

这条规则并不成立：`beforeFetch` 只作用于列表查询，而按主键读取、修改、删除走的是 `verifyIdPermissions`，它只用主键构造查询。也就是说，那些行**在列表里被藏起来，却仍可按 id 读取、修改和删除**——看起来像一道边界，实际上不是。

2.2.0 起两个模型的可见性统一由**菜单与角色权限**决定，与框架其余部分保持一致。`EruptUser` 改为继承 `HyperModelCreatorVo`（即 `LookerSelf` 自身的父类），映射列没有变化，**无需数据库迁移**。`LookerSelf` 本身予以保留，下游实体仍可继续继承。

:::warning 升级后请立即复核
这是一次**访问面扩大**：持有用户 / 角色菜单的非管理员用户，升级后将看到全部行。请确认这两个菜单的授权范围符合预期。
:::

#### 2. erupt-designer 数据存储迁移到 SQLite

**影响范围**：使用 [erupt-designer](/zh/modules/erupt-designer) 并已录入业务数据的项目。

设计器模型的数据不再存放于主库的 `e_designer_data` 表，改为内嵌 SQLite 文件（默认 `data/designer.db`），每个已发布设计对应其中一张真实表。

- **不会自动迁移**：升级后重新发布设计即可得到新表结构；如需保留历史数据，请从 `e_designer_data` 导出 JSON 后重新导入。
- **旧表不再使用**：`e_designer_data` 不会再被读写，Hibernate 也不会自动删除它。确认数据已迁移或不再需要后，可手动 `DROP TABLE e_designer_data`（不可逆）。设计配置表 `e_designer` 仍在使用，请勿删除。
- **务必纳入备份**：该文件独立于主数据库，容器化部署需挂载到持久化卷，否则重建后数据丢失。
- 设计配置本身（`e_designer`）不受影响，路径可用 `erupt.designer.db-path` 调整。

#### 3. 图标库升级至 Font Awesome 7

**影响范围**：所有自定义过菜单图标、`@Drill` / `@RowOperation` 图标的项目。

`font-awesome` 4.7 已于 2016 年停更，2.2.0 迁移到 `@fortawesome/fontawesome-free` 7.x。旧类名通过 `v4-shims` 继续可用，786 个 FA4 类名中仅 `meanpath` 与 `tripadvisor` 失去对应图标。

一处视觉差异：FA7 为每个 `.fa` 设置了 `1.25em` 的默认宽度（FA4 无此设置），图标会落在统一方框内。需要旧版度量时设置 `--fa-width: auto`。

#### 4. Erupt 类注册表从 erupt-monitor 迁入 erupt-atlas

**影响范围**：使用了「系统监控 → Erupt 类注册表」菜单的项目，以及在代码中引用了 `xyz.erupt.monitor.model.EruptClassInfo` 的项目。

类注册表（`EruptClassInfo`）与其字段下钻（`EruptFieldInfo`）读取的是运行时模型注册表，和模型图谱是同一份数据。2.2.0 起两者归入 [erupt-atlas](/zh/modules/erupt-atlas#类注册表)，包名由 `xyz.erupt.monitor` 改为 `xyz.erupt.atlas`；erupt-monitor 回归纯系统监控（服务、缓存、诊断）。注册表行上新增「在图谱中查看」操作，可直接跳到该模型的关系图。

菜单初始化**只增不改**，已有的 `EruptClassInfo` / `EruptFieldInfo` 菜单行会原样保留在「系统监控」下，请按情况处理：

| 项目情况 | 升级后表现 | 处理方式 |
| --- | --- | --- |
| 只引入了 `erupt-monitor` | 旧菜单指向的模型不再注册，打开报错 | 引入 `erupt-atlas`，或在菜单管理中删除「Erupt 类注册表」及隐藏的 `EruptFieldInfo` 菜单 |
| 同时引入了 `erupt-atlas`（含 `erupt-spring-boot-starter-all`） | 旧菜单继续可用，但仍挂在「系统监控」下；「模型图谱」根菜单下只有「模型关系图」 | 在菜单管理中把「Erupt 类注册表」移到「模型图谱」下；或删除旧菜单后重启，由框架在新位置重建 |
| 自定义代码引用了 `xyz.erupt.monitor.model.*` 或 `EruptClassInfoDataService` | 编译失败 | 改为 `xyz.erupt.atlas.model.*` / `xyz.erupt.atlas.service.*`，并确认已依赖 `erupt-atlas` |

### 需要留意的默认值变化

| 项目 | 2.1.x | 2.2.0 |
| --- | --- | --- |
| `@Power(cellEdit)` | —— | `true`，表格默认支持单元格编辑，详见 [@Power](/zh/annotation/power#celledit-单元格编辑) |
| `@Edit(ai)` | —— | `true`，文本字段默认提供 [表单 AI 写作助手](/zh/modules/erupt-ai/writing-assistant) |
| 前端默认主题色 | `#00B515` | `rgb(22, 119, 255)`，可用 `app.js` 的 `theme.primaryColor` 覆盖 |
| 菜单树展开层级 | 5 级 | 1 级 |

:::tip 需要收紧默认值时
- 某张表的行必须整体审阅后修改：`@Erupt(power = @Power(cellEdit = false))`
- 某个字段不该在表格里随手改：`@Edit(cellEdit = false)`
- 某个模型完全不提供 AI 能力：`@Erupt(power = @Power(ai = false))`
:::

### 数据库变更

:::info
表结构变更由 JPA / Hibernate 在启动时自动执行，仅当项目禁用了自动 DDL（`spring.jpa.hibernate.ddl-auto=none` 或 `validate`）时才需手动执行。
:::

完整 SQL 见 [2.2.0 更新日志 → 数据库变更](/zh/guide/changelog#数据库变更)，涉及：

- `e_remote_host`：引入 [erupt-remote](/zh/modules/erupt-remote) 时新建，由 Hibernate 自动创建
- `e_ai_canvas_model`：新增表；`e_ai_canvas` 的 `data_type`、`target_model` 两列迁移后删除（引入 erupt-ai-canvas 时）
- `e_ai_chat_message`：新增 `images` 列（引入 erupt-ai 时）
- `e_designer_data`：不再使用，可在确认数据已迁移后手动删除（引入 erupt-designer 时）

### 升级后核查清单

重启后请依次确认：

1. **用户 / 角色菜单授权** —— 非管理员用户现在能看到这两张表的全部行，确认授权范围符合预期（见破坏性变更 1）
2. **敏感模型的单元格编辑** —— 表格默认支持单元格编辑，需要整行审阅才能修改的模型加 `@Power(cellEdit = false)`，不该在表格里随手改的字段加 `@Edit(cellEdit = false)`
3. **AI 写作助手范围** —— 文本字段默认提供写作助手，不希望 AI 介入的模型加 `@Power(ai = false)`
4. **匿名遥测** —— 默认开启，内网或合规要求严格的环境可用 `erupt.telemetry.enabled=false` 关闭
5. **erupt-designer 数据卷** —— 容器化部署确认 `data/designer.db` 已挂载到持久化卷并纳入备份
6. **菜单图标显示** —— Font Awesome 7 下抽查自定义图标是否正常，异常时对照 [FA7 图标库](https://fontawesome.com/search)更换类名
7. **前端资源缓存** —— 前端资源本次变化较大（主题体系、图标库），如页面样式异常请强制刷新浏览器缓存
8. **禁用了自动 DDL 的项目** —— 确认上述 SQL 已执行
9. **Erupt 类注册表菜单** —— 该菜单已随模型迁入 erupt-atlas，确认「系统监控」下的旧菜单仍能打开（已引入 erupt-atlas）或已删除（见破坏性变更 4）


## V 2.1.0 升级指南

本节说明从 2.0.x 升级到 2.1.0 时需要注意的事项。

### 升级要求

1. Spring Boot 版本升级至 **3.5.16**（使用 `<parent>` 继承 spring-boot-starter-parent 的项目仅需修改版本号）
2. JDK 最低版本要求为 **JDK 17**（无变化）
3. 将 Erupt 版本号统一修改为 `2.1.0`
4. 使用了 [erupt-cloud-node](/zh/modules/cloud-node) 的项目，**节点服务也必须同步升级至 2.1.0**

### 破坏性变更

#### 1. `erupt-jpa` 更名为 `erupt-data-jpa`

**影响范围**：`pom.xml` 中显式声明了 `erupt-jpa` 依赖的项目。

2.1.0 将 JPA 数据源统一归入 erupt-data 数据连接层，**artifactId** 由 `erupt-jpa` 变更为 `erupt-data-jpa`。
**Java 包名没有变化**，仍为 `xyz.erupt.jpa.*`（如 `xyz.erupt.jpa.model.BaseModel`、`xyz.erupt.jpa.dao.EruptDao`），
因此只需修改依赖坐标，业务代码无需调整。

```xml
<!-- 旧写法（构建时报找不到依赖） -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- 新写法 -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

#### 2. `erupt-mongodb` 更名为 `erupt-data-mongodb`

**影响范围**：`pom.xml` 中显式声明了 `erupt-mongodb` 依赖的项目。

与 JPA 同理，**artifactId** 由 `erupt-mongodb` 变更为 `erupt-data-mongodb`，Java 包名仍为 `xyz.erupt.mongodb.*`，无需改动业务代码。

```xml
<!-- 旧写法（构建时报找不到依赖） -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- 新写法 -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

:::tip
使用 [erupt-spring-boot-starter](/zh/guide/quick-start) 或 `erupt-spring-boot-starter-all` 的项目，依赖由启动器统一管理，无需手动修改。
:::

#### 3. `erupt-tpl-ui.amis` 模块已移除

**影响范围**：依赖了 AMIS 模板集成模块的项目。

`erupt-tpl-ui` 中的 AMIS 集成模块（artifactId：`erupt-tpl-ui.amis`）已从 2.1.0 中移除，请从 `pom.xml` 中删除该依赖：

```xml
<!-- 该依赖已不再发布，请移除 -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui.amis</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

如项目中使用了 AMIS 页面，请迁移至 erupt-tpl 支持的其他模板集成方式（`erupt-tpl-ui.ant-design`、`erupt-tpl-ui.element-ui`、`erupt-tpl-ui.element-plus`），
或改用 [erupt-ai-canvas](/zh/modules/erupt-ai-canvas) 生成自定义页面。这三个模板皮肤的 artifactId 未发生变化，仅目录位置由 `erupt-tpl-ui/` 调整为 `erupt-tpl/`，不影响依赖声明。

## V 2.0.0 升级指南

本节说明从 1.14.x 升级到 2.0.0 时需要注意的事项。

### 升级要求

1. Spring Boot 版本升级至 **3.5.15**（使用 `<parent>` 继承 spring-boot-starter-parent 的项目仅需修改版本号）
2. JDK 最低版本要求为 **JDK 17**（无变化）
3. 将 Erupt 版本号统一修改为 `2.0.0`
4. 使用了 [erupt-cloud-node](/zh/modules/cloud-node) 的项目，**节点服务也必须同步升级至 2.0.0**

### 破坏性变更

#### 1. 密码加密算法升级（MD5 → SHA-512 + Salt）

**影响范围**：所有使用 Erupt 内置 UPMS 登录体系的系统。

升级后，系统改用 SHA-512 + 盐值（Salt）对新建及重置的密码进行加密。**此变更向后兼容**——`EruptUserService` 中的 `checkPwd` 方法会检查 `encryptType` 字段：`encryptType` 为空或为 `MD5` 的用户（即现有用户）仍可使用原密码正常登录；只有新建或重置后的密码才会使用 SHA-512 + 盐值加密。感谢 [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) 贡献此安全改进（Gitee [!35](https://gitee.com/erupt/erupt/pulls/35)）。

**处理方式**：
- **无需强制迁移**：现有用户无需任何操作即可继续登录。
- **可选批量迁移**：如需将全部用户密码升级为新算法，可使用 `SecretUtil.encodePassword(plaintext, salt)` 重新加密，并更新 `e_upms_user` 表的 `password`、`salt` 和 `encrypt_type` 字段。

#### 2. `DataProxy.extraContent` 签名变更

**影响范围**：实现了 `DataProxy` 并覆盖了 `extraContent` 方法的类。

| | 旧签名 | 新签名 |
|---|---|---|
| 方法 | `default String extraContent(List<Condition> conditions)` | `default String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list)` |

新增的第二个参数 `list` 为当前页的数据集合，可据此渲染包含行数据的动态 HTML。

```java
// 旧写法（覆盖了此方法的类需更新）
@Override
public String extraContent(List<Condition> conditions) {
    return "<div>自定义内容</div>";
}

// 新写法
@Override
public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
    return "<div>自定义内容，当前页共 " + list.size() + " 条数据</div>";
}
```

#### 3. `HTML_EDITOR` 默认编辑器改为 CKEditor

**影响范围**：使用了 `EditType.HTML_EDITOR` 字段类型的模块。

2.0.0 将 HTML_EDITOR 组件的默认富文本编辑器由 **UEditor** 改为 **CKEditor**。升级后，所有未显式指定编辑器类型的 HTML_EDITOR 字段将自动使用 CKEditor 渲染。

**如需继续使用 UEditor**，需通过注解显式声明：

```java
@Edit(
    type = EditType.HTML_EDITOR,
    htmlEditorType = @HtmlEditorType(type = HtmlEditorType.Type.UEDITOR)
)
private String content;
```

#### 4. `AutoCompleteHandler`、`ChoiceFetchHandler`、`TagsFetchHandler` 需要泛型参数

**影响范围**：实现了上述任一接口的类。

`fetchFilter` 方法的参数类型由 `Map<String, Object> formData` 改为实际模型对象（泛型 `T`），接口也改为泛型接口。

```java
// 旧写法（编译报错）
class MyHandler implements ChoiceFetchHandler {
    @Override
    public List<String> fetchFilter(Map<String, Object> formData, ...) {
        String value = (String) formData.get("someField");
        ...
    }
}

// 新写法
class MyHandler implements ChoiceFetchHandler<MyEruptClass> {
    @Override
    public List<String> fetchFilter(MyEruptClass data, ...) {
        String value = data.getSomeField();
        ...
    }
}
```

`AutoCompleteHandler` 和 `TagsFetchHandler` 的迁移方式相同。

#### 5. Excel 导入模板格式从 `.xls` 改为 `.xlsx`

**影响范围**：已缓存或收藏了导入模板下载链接的用户。

Excel 导入模板的生成格式已从旧版 `.xls` 升级为 `.xlsx`。如果用户的浏览器或下载工具缓存了旧的模板文件，需清除缓存或重新下载模板。

#### 6. `@Search.vague` 属性已移除

**影响范围**：代码中使用了 `@Search(vague = true)` 或 `@Search(vague = false)` 的字段。

```java
// 旧写法（编译报错）
@Edit(search = @Search(vague = true))
@Edit(search = @Search(vague = false))

// 新写法
@Edit(search = @Search)            // 等同于旧的 vague = true（高级搜索为默认行为）
@Edit(search = @Search(value = true)) // 仅开启搜索，无特殊含义变化
```

高级搜索（范围查询、模糊匹配等）现为各组件的默认行为，无需额外配置。

#### 7. `EruptApiModel` 类已删除

**影响范围**：代码中使用了 `EruptApiModel.PromptWay` 的地方。

```java
// 旧写法（编译报错）
throw new EruptApiErrorTip("错误信息", EruptApiModel.PromptWay.MESSAGE);
throw new EruptApiErrorTip("错误信息", EruptApiModel.PromptWay.NOTIFY);

// 新写法
throw new EruptApiErrorTip("错误信息", R.PromptWay.MESSAGE);
throw new EruptApiErrorTip("错误信息", R.PromptWay.NOTIFY);
```

同时，如果项目中直接引用 `EruptApiModel` 类，请替换为 `R<T>`：

```java
// 旧写法
import xyz.erupt.core.view.EruptApiModel;

// 新写法
import xyz.erupt.core.view.R;
```

#### 8. `ChoiceTrigger` 接口已移除

**影响范围**：实现了 `ChoiceTrigger` 接口的类。

该接口已于早期版本废弃，2.0.0 正式删除。请使用 `@ChoiceType.fetchHandler` 替代：

```java
// 新写法：通过 fetchHandler 实现联动
@Edit(
    choiceType = @ChoiceType(fetchHandler = MyChoiceFetchHandler.class)
)
```

详见：[Choice 组件 → fetchHandler](/zh/field-types/choice#动态列表)

#### 9. 登录与修改密码接口改为 HTTP POST

**影响范围**：自定义登录页、直接调用 Erupt 登录 API 的前端代码。

| 接口 | 旧方式 | 新方式 |
|------|--------|--------|
| `/erupt-api/erupt-user/login` | GET | POST |
| `/erupt-api/erupt-user/change-pwd` | GET | POST |

如果使用了自定义登录页，需将对应的 AJAX 请求方式由 `GET` 改为 `POST`。

### API 变更速查

| 旧 API | 新 API |
|--------|--------|
| `EruptApiModel.PromptWay.MESSAGE` | `R.PromptWay.MESSAGE` |
| `EruptApiModel.PromptWay.NOTIFY` | `R.PromptWay.NOTIFY` |
| `EruptApiModel.PromptWay.DIALOG` | `R.PromptWay.DIALOG` |
| `@Search(vague = true)` | `@Search` |
| `@Search(vague = false)` | `@Search(value = true)` |
| `ChoiceTrigger` 接口 | `@ChoiceType.fetchHandler` |
| `MD5Util` | `EncryptUtil` / `SecretUtil` |
| `EditType.COLLAPSE` | `EditType.GROUP` |

### 数据库变更

:::info
所有表结构变更均由 JPA / Hibernate 在启动时自动执行。仅当项目**禁用了 Hibernate 自动 DDL**（`spring.jpa.hibernate.ddl-auto=none` 或 `validate`）时，才需要手动执行以下脚本。
:::

#### `e_upms_user` 表新增字段

```sql
ALTER TABLE e_upms_user ADD COLUMN salt         VARCHAR(64);
ALTER TABLE e_upms_user ADD COLUMN encrypt_type VARCHAR(20);
```


### 升级必做操作

:::warning
以下操作**必须在升级后首次启动前完成**，否则相关模块的菜单将出现路由不匹配或空白页问题。
:::

#### 第一步：删除 `.erupt` 目录

`.erupt` 目录（位于 JVM 工作目录）保存了模块初始化标记文件。删除后，框架在下次启动时会重新执行所有模块的菜单初始化逻辑：

```bash
rm -rf .erupt
```

#### 第二步：手动删除受影响的旧菜单

登录后台 → 系统设置 → 菜单管理，按需删除以下菜单：

##### 使用了 erupt-monitor

2.0.0 对 erupt-monitor 进行了**完全重写**，菜单结构与旧版完全不同，旧菜单无法自动迁移：

找到**"系统监控"**（或 Monitor）根菜单，将其下所有子菜单及根菜单本身全部删除。

##### 使用了 erupt-terminal

2.0.0 重构了终端模块前端 UI，旧版路由已变更：

找到**"终端"**菜单，将其删除。

#### 第三步：重启应用

重启后，系统自动重新生成上述模块的最新菜单。

## 历史升级指南

- [1.12.x → 1.13.x 升级指南](https://www.yuque.com/erupts/1.13.x)
