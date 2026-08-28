# 升级指南

本文档按版本说明 Erupt 升级时需要注意的事项，请按版本顺序依次阅读。

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
