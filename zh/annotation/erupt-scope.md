# @EruptScope 全局上下文 <Badge type="tip" text="v2.4.0+" />

`@EruptScope` 把模型放进一个**作用域**：用户在页头选一次（一个集群、一个项目、一家公司……），所有声明了该作用域的模型就都跟着它走——列表只看这个范围内的数据，新增的数据落到这个范围里。

作用域本身就是一个普通的 `@Erupt` 表单类，它的每个字段就是一个条件，所以选项、级联、默认值与校验全部复用表单注解，不需要新的 DSL。

## 适用场景

- **多集群 / 多环境运维**：页头选集群，Pod、Deployment、Service 等模型都只显示该集群的资源
- **多项目协作**：页头选项目，任务、需求、文档、成员都落在当前项目下
- **集团多公司**：页头选公司，订单、客户、发票按公司隔离
- 任何「先选一个上下文，再在它里面干活」的场景

与 [@Filter](/zh/annotation/filter) 的区别：`@Filter` 是写死在模型上的过滤条件，用户不可见也不可改；`@EruptScope` 是用户**主动选择**的上下文，并且会同时作用于查询、详情、修改、删除、行操作与新增。

## 声明作用域

作用域就是一个表单类。下面声明一个「项目」作用域，一个必选的下拉框加一个自由文本：

```java
@Getter
@Setter
// 作用域是表单而非数据表，用第一个字段充当 @Erupt 必需的主键
@Erupt(name = "项目", primaryKeyCol = "project")
public class ProjectScope {

    @EruptField(edit = @Edit(title = "项目", type = EditType.CHOICE, notNull = true,
            choiceType = @ChoiceType(vl = {@VL(value = "alpha", label = "Alpha"), @VL(value = "beta", label = "Beta")})))
    private String project;

    // 自由文本：没有选项可校验，按用户输入的值使用
    @EruptField(edit = @Edit(title = "标签"))
    private String tag;

}
```

关于作用域类的几条规则：

- 必须是 `@Erupt` 类，且有无参构造；`primaryKeyCol` 指向任意一个字段即可，它不会被持久化
- 所有带 `edit.title` 的字段都参与作用域；`CHOICE` / `MULTI_CHOICE` 的值会与用户可见的选项逐一核对，其他类型按输入值使用
- 选项可以来自 `@VL`、`fetchHandler`、`@ChoiceType(dependField)` 级联等任何表单支持的方式，`notNull`、`@Dynamic`、`onchange` 一样生效
- 默认值来自 `DataProxy.addBehavior`：用户还没选时，页头先拿这个值；必填字段没有默认值时不猜，而是让用户选

实际项目中选项通常按用户过滤，这样作用域同时也是一道隔离。下面是 erupt-ai-dev 模块里的真实例子，选项是当前用户参与的项目，默认选第一个：

```java
@Erupt(name = "当前项目", primaryKeyCol = "project", dataProxy = ProjectScopeProxy.class)
@Getter
@Setter
public class DevProjectScope {

    @EruptField(edit = @Edit(title = "项目", notNull = true, type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = MemberProjectFetch.class)))
    private Long project;

}

@Component
public class ProjectScopeProxy implements DataProxy<DevProjectScope> {

    @Resource
    private DevAccessService devAccessService;

    // 用户还没选时，页头先拿第一个可见项目
    @Override
    public void addBehavior(DevProjectScope scope) {
        List<DevProject> projects = devAccessService.visibleProjects();
        if (!projects.isEmpty()) scope.setProject(projects.get(0).getId());
    }

}
```

### 注解属性说明

```java
@EruptScope(ProjectScope.class)
@Erupt(name = "任务")
public class Task extends BaseModel { ... }
```

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `value` | Class | - | 作用域表单类，必须是一个 `@Erupt` 类 |
| `bind` | boolean | true | 是否按字段名自动绑定：模型中与作用域同名的字段，列表按选中值过滤，新增与修改强制写入选中值。数据源自己通过 `EruptScopes.get()` 读取作用域时可关闭 |

## 绑定模型

在模型上声明 `@EruptScope`，模型中**与作用域字段同名**的字段就被绑定了：

```java
@Getter
@Setter
@Entity
@EruptScope(ProjectScope.class)
@Erupt(name = "任务")
public class ScopedTask extends BaseModel {

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称", notNull = true))
    private String name;

    // 与 ProjectScope.project 同名：被作用域绑定
    @EruptField(views = @View(title = "项目"), edit = @Edit(title = "项目", notNull = true, search = @Search))
    private String project;

    // 与 ProjectScope.tag 同名：同样绑定；作用域里留空则不过滤
    @EruptField(views = @View(title = "标签"), edit = @Edit(title = "标签"))
    private String tag;

}
```

绑定之后，当前页头选中 `beta` 时：

| 动作 | 效果 |
| --- | --- |
| 表格 / 树查询 | 自动追加 `project = 'beta'` 条件；多选值用 `IN` |
| 详情、修改、删除、行操作 | 按 id 校验：不在当前作用域内的记录视为不存在，一批 id 中有一个越界整批拒绝 |
| 新增、修改 | 提交的 `project` 被覆盖为 `beta`，客户端传什么都没用；多选作用域下，提交值必须是选中值之一 |
| 新增表单 | `project` 预填为 `beta`，用户能看到记录会落在哪 |
| 单元格编辑 | 被绑定的字段拒绝单元格编辑，避免把记录「挪出」作用域 |

### 引用字段按 id 绑定

绑定字段不限于简单类型。作用域持有 id，模型的 `REFERENCE_TABLE` / `REFERENCE_TREE` 字段持有被引用的行，二者同名时按 id 绑定：

```java
// 作用域：选项是 RefTargetModel 的行，值为其 id
@Erupt(name = "目标", primaryKeyCol = "target")
public class TargetScope {

    @EruptField(edit = @Edit(title = "目标", type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = TargetScope.Options.class)))
    private Long target;

}

// 模型：同名的引用字段
@EruptScope(TargetScope.class)
@Erupt(name = "任务")
public class TargetScopedTask extends BaseModel {

    @ManyToOne
    @EruptField(views = @View(title = "目标", column = "name"), edit = @Edit(title = "目标", notNull = true,
            type = EditType.REFERENCE_TABLE, referenceTableType = @ReferenceTableType(label = "name")))
    private RefTargetModel target;

}
```

查询条件变成 `target.id = ?`，新增时 `target` 被填成 `{id: 选中值, name: 选项文本}`，表单里直接显示引用对象的名称。

### 在代码中读取作用域

需要自己处理作用域（例如数据源不是 JPA，或者 `bind = false`）时，任何地方都可以读取当前请求已校验的作用域值：

```java
ProjectScope scope = EruptScopes.get(ProjectScope.class);
String project = scope.getProject();
```

请求没有携带选择时返回默认值；必填字段仍为空则直接抛异常，而不是放行一个「不限范围」的查询。

:::warning 只有被请求的模型声明的作用域才会被读取
`EruptScopes.get()` 只在当前请求对应的模型声明了该作用域时才有值。在一个没有声明作用域的模型里读取它，等同于用户没有选择。
:::

## 页面行为

- **页头选择器**只出现在声明了该作用域的模型页面上（表格、树、表单），其他页面不显示；一个页面的模型声明几个作用域就有几个选择器
- 点击选择器弹出作用域表单，表单就是作用域类本身渲染出来的，按**切换**后当前窗口所有已打开的页签重建，列表立刻变成新范围
- 必填作用域还没有选择时，模型页面不会打开，也不会发出任何请求，而是跳到独立的选择页 `/build/scope/:scope`；选完自动回到原页面。地址栏保留原页面地址，刷新会再次询问
- 表格会**隐藏**被作用域绑定的搜索字段（页头已经决定了），以及被单个作用域值钉死的列（每行都是同一个值，没必要显示）；多选作用域的列照常显示
- 用户最后一次的选择按账号记在浏览器里，下次登录自动恢复并重新校验；选项已失效的旧选择会被丢弃并回到默认值
- 每个浏览器窗口各自持有一份选择，窗口之间互不影响，页面和它发出的请求永远一致
- `@Tpl` 等通过 URL 打开的页面无法设置请求头，作用域以 `_scope` URL 参数携带，值与请求头相同；模板里可以从中读取当前作用域

## 校验与安全

选中的值由客户端在每次请求的 `erupt-scope` 请求头中携带，内容是 URL 编码后的 JSON：

```
erupt-scope: %7B%22ProjectScope%22%3A%7B%22project%22%3A%22beta%22%7D%7D
```

解码后即 `{"ProjectScope":{"project":"beta"}}`。服务端的处理规则：

1. 只读取**当前请求的模型**声明的那个作用域，请求头里其他键一律忽略
2. `CHOICE` / `MULTI_CHOICE` 的值在**每次请求**都与当前用户可见的选项核对，与新增数据时的校验一致；其他字段没有选项可核对，按输入值使用
3. 核对不通过、JSON 格式错误：视为没有选择，回落到默认值。必填字段因此为空时拒绝请求，提示 `erupt.scope.required`（"未选择，请先在页头选择"）
4. 可选字段留空表示「全部」，不追加条件

框架自身不缓存选项：代价较高的 `fetchHandler` 应该自己缓存，因为只有它知道选项多久有效。

:::danger 作用域不是权限
作用域只会把模型菜单**本来就能看到**的数据再缩小一圈，它不能替代权限。要把用户真正隔开（例如不许看到自己不是成员的项目），请让作用域的选项按用户过滤——核对规则会保证用户只能选到自己可见的选项——或者使用 [@Filter](/zh/annotation/filter) / 数据权限。
:::

相关提示文案：

| i18n key | 含义 |
| --- | --- |
| `erupt.scope.required` | 必填作用域未选择 |
| `erupt.scope.option_invalid` | 选中的值不在可选范围内 |
| `erupt.scope.out_of_scope` | 多选作用域下提交的值不在选中范围内 |
| `erupt.scope.not_found` | 作用域不存在或当前用户无权访问 |

## 接口

两个接口都只需登录，由 erupt-upms 提供。

**`GET /erupt-api/scope`** —— 当前用户可见的作用域。某个作用域可见，当且仅当至少一个声明了它的模型在用户的菜单里：

```json
[
  {
    "name": "ProjectScope",
    "title": "项目",
    "parent": "ScopedTask",
    "models": ["ScopedTask"],
    "fields": ["project", "tag"],
    "defaults": {
      "values": {"project": "alpha"},
      "labels": {"project": "Alpha"}
    }
  }
]
```

| 字段 | 说明 |
| --- | --- |
| `name` | 作用域类的简单类名，也是请求头 JSON 的键 |
| `title` | 页头显示的标题，即作用域类的 `@Erupt(name)` |
| `parent` | 一个声明了该作用域的模型；加载作用域表单（`GET /erupt-api/build/{scope}`）时作为 `eruptParent` 传入 |
| `models` | 声明了该作用域、且在用户菜单里的模型，页头只在它们的页面上显示选择器 |
| `fields` | 作用域的条件字段，按表单顺序 |
| `defaults` | 默认值及其显示文本；必填字段没有默认值时为 `null`，页面会要求用户选择 |

**`POST /erupt-api/scope/{scope}`** —— 校验一次选择，返回保留的值及其显示文本。校验与新增数据相同，外加选项核对：

```http
POST /erupt-api/scope/ProjectScope
Content-Type: application/json
token: <登录 token>

{"project": "beta", "tag": "urgent"}
```

```json
{
  "values": {"project": "beta", "tag": "urgent"},
  "labels": {"project": "Beta", "tag": "urgent"}
}
```

自己写客户端时，把 `values` 以 `{"<scope>": values}` 的形式 JSON 序列化并 URL 编码后放进 `erupt-scope` 请求头，随后的 `/erupt-api` 请求就运行在该作用域内。接口定义见 [OpenAPI 规范](/zh/advanced/rest-api#openapi-规范)。
