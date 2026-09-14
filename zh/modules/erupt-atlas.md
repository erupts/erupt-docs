# Erupt Atlas 模型图谱

erupt-atlas 把运行时注册表里的全部 `@Erupt` 模型和它们之间的关系画成一张图：谁引用了谁、模块之间耦合到什么程度、改一个模型会波及哪些地方。

> 最低版本要求：**2.2.0**

图谱不依赖任何额外配置，也不落库——每次打开都从 `EruptCoreService` 现场重建，因此 erupt-designer 发布的运行时模型、erupt-flow 的表单模型都会自动出现，无需重启。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-atlas</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

模块依赖 `erupt-upms`、`erupt-tpl` 与 `erupt-data-jpa`（均为 `provided`，常规项目已具备）。引入后自动装配生效，菜单中出现 **模型图谱** 根菜单（图标 `fa fa-diagram-project`），下含 **模型关系图** 与 **Erupt 类注册表** 两个入口。

## 界面预览

**总览**：按模块分组铺开全部模型，顶部给出「模型数 · Cube 数 · 关系数 · 模块数」，选中某个模型后，底部面板按 `RELATIONS` / `FIELDS` / `CONFIG` 列出它被谁引用、引用了谁。

![模型图谱 · 总览](/erupt-atlas/model-atlas-overview.jpg)

**层级**：依赖深度报表——整个系统站在哪些「地基模型」之上，深度又来自哪几条链。

![模型图谱 · 层级](/erupt-atlas/model-atlas-layers.jpg)

## 七种视图

| 视图 | 说明 |
| --- | --- |
| 血缘 Lineage | 选中一个模型，按 1~5 跳深度追溯：谁引用了它、它又引用了谁 |
| 层级 Layers | 依赖深度报表：层数、已分层模型数、地基模型数、最长依赖链；L0…Ln 逐层展开，地基列表按「有多少模型站在它上面」排序，点击任意模型直接跳到它的血缘 |
| 总览 Overview | 全部模型按模块分组展示，一眼看清系统结构 |
| 矩阵 Matrix | 模块之间的耦合热力图，对角线为模块内部耦合，其余格子为跨模块依赖 |
| 权限 Power | `@Power` 声明与菜单树上实际存在的功能按钮对账，见下 |
| 影响面 Impact | 以选中模型为中心，按距离列出改动会波及的模型 |
| 体检 Audit | 图能看出、但图上说不清楚的结构问题，见下 |

### 域聚焦

顶部的域（模块）筛选条决定视图的关注范围：可只看某一个模块，也可保持 `All` 查看全局；未与任何模型产生结构关系的模型会单独标注，不参与分层。模型多、模块多的系统中，这是让图重新变得可读的关键开关。

### 权限对账

`Power` 视图把每个模型的**声明权限**与**菜单上的功能按钮**并排列出，用于排查「注解开了但按钮没配」或「按钮配了但注解关着」这类不一致：

| 列 | 含义 |
| --- | --- |
| 模型 / 模块 | 模型名与所属模块 |
| 菜单类型 | 该模型在菜单树中的类型（未挂菜单时为空） |
| 已开启权限 | `@Power` 中为 true 的项：add、edit、delete、query、detail、export、import、print、copy、cellEdit、ai |
| 菜单按钮 | 菜单树中实际存在的功能权限按钮 |
| powerHandler | 配置了动态权限处理器时显示其类名 |

:::info 按钮侧依赖 erupt-data-jpa
按钮数据读自菜单表，未引入 `erupt-data-jpa` 时没有菜单表可读，该列为空，声明侧仍正常展示。
:::

## 结构体检

`Audit` 视图汇总四类结构问题：

| 检查项 | 含义 |
| --- | --- |
| 循环引用 cycles | 模型之间形成的引用环，通常意味着需要拆分或反转依赖 |
| 共享表 sharedTables | 多个 `@Erupt` 模型映射到同一张物理表 |
| 孤岛模型 orphans | 没有任何模型引用它，它也不引用任何模型 |
| 未发布 unpublished | 已注册但未挂到任何菜单上的模型 |

## 图谱包含哪些节点

| 节点类型 | 来源 |
| --- | --- |
| `erupt` | 标注了 `@Erupt` 的模型 |
| `cube` | `@EruptCube` 语义模型（需引入 [erupt-cube](/zh/modules/pro/erupt-cube/)） |
| `remote` | 由 [erupt-cloud](/zh/modules/erupt-cloud) 节点提供的远程模型 |

边的类型涵盖 `reference`（引用字段）、`tab`（子表）、`embed`（内嵌）、`drill`（下钻）、`operation`（行操作）、`cubeOf`、`join`、`table`（共享表）。

## 类注册表 <Badge type="tip" text="v2.2.0 自 erupt-monitor 迁入" />

图谱看关系，注册表做查找：**Erupt 类注册表** 是同一份运行时注册表的表格视图，列出当前进程中所有已加载的 `@Erupt` 模型，数据直接来自 `EruptCoreService`，不落库；erupt-designer 发布的运行时模型、erupt-cloud 节点提供的远程模型同样在列。

<img src="/monitor/erupt-register.png" width="900">

**列表信息**：

| 列 | 说明 |
| --- | --- |
| 来源（Source） | 模型所属的模块 / jar，可按来源筛选 |
| 类名 / 显示名 | 模型类名与 `@Erupt(name)` 显示名，支持模糊搜索 |
| 多语言 | 是否标注了 `@EruptI18n` |
| 字段数 | 模型中 `@EruptField` 字段数量 |
| 数据处理器 | 模型使用的数据源处理器（JPA、MongoDB、JDBC 等） |
| 运行时注册 | 是否为运行时动态注册的模型 |
| 已发布 | 该模型是否已发布为菜单 |

**行操作**：

- **在图谱中查看**：跳转到模型关系图并定位到该模型，字段下钻页里的每一行同样带有此入口
- **字段（下钻）**：查看该模型的全部 `@EruptField` 明细——字段名、标题、类型、编辑组件、是否必填 / 可搜索
- **发布到菜单**：未发布的模型可直接发布为 TABLE 类型菜单，自动生成全套功能按钮权限并刷新菜单缓存
- **模型 JSON**：查看详情时展示类级注解解析后的完整 JSON 结构

:::tip 从 2.1.x 升级
注册表原属 erupt-monitor 的「系统监控」菜单，旧菜单行不会自动搬家，处理方式见[升级指南](/zh/guide/upgrade#_4-erupt-类注册表从-erupt-monitor-迁入-erupt-atlas)。
:::

## 接口与权限

| 接口 | 说明 |
| --- | --- |
| `GET /erupt-api/erupt-atlas/view` | 返回图谱快照（节点、边、审计结果） |
| `GET /erupt-api/erupt-atlas/power` | 权限对账数据 |
| `GET /erupt-api/erupt-atlas/detail/{erupt}` | 打开某个模型时按需拉取它的字段明细 |

上述接口均以 `@EruptMenuAuth("erupt-atlas.html")` 校验菜单权限，在角色管理中把 **模型关系图** 菜单授予对应角色即可控制访问范围；类注册表是普通的 `@Erupt` 表格菜单，按常规菜单授权。

关系图支持 `?erupt=<模型名>` 参数直接定位到某个模型，注册表的「在图谱中查看」正是通过它跳转。

图谱中的模型名称与界面文案跟随控制台当前语言：标注了 `@EruptI18n` 的模型走 `I18nTranslate` 翻译，未标注的保留注解原文。

:::tip
字段明细按需加载，而非随图谱一次性下发——整个注册表的字段清单往往比图本身大一个数量级。
:::
