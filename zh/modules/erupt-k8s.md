# Erupt Kubernetes 数据源

erupt-data-k8s 模块基于 fabric8 kubernetes-client 提供 Kubernetes 数据源支持。将 `@Erupt` 模型绑定到一种资源类型（Pod、Deployment、Service、ConfigMap、Node、CustomResource 等），即可获得可筛选、可搜索、带权限控制的资源管理视图，并支持从资源嵌套的 spec / status 中提取任意字段。

**浏览 + 删除开箱即用，写入走 YAML。** 通过表单字段拼 K8s spec 远不如直接编写清单可靠，所以模型声明一个 `yaml` 字段后，新增 / 修改就按 `kubectl create` / `kubectl replace` 的方式提交整份清单；没有该字段的模型即为只读 + 删除。

:::tip 不想写模型？
[erupt-k8s-dashboard](/zh/modules/apps/erupt-k8s-dashboard) 基于本模块，内置了 Pod、Deployment 等常用资源的管理台，加依赖即得菜单。本模块适合给它没有覆盖的资源（如自定义资源）建模。
:::

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-k8s</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## @EruptK8s 注解（类级）

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `apiVersion` | — | API 组 / 版本，如 `v1`、`apps/v1`、`batch/v1` |
| `kind` | — | 资源类型，如 `Pod`、`Deployment`、`ConfigMap` |
| `namespace` | `""` | 固定命名空间；`"*"` 表示跨全部命名空间；为空表示集群级资源，或客户端的默认命名空间 |
| `masterUrl` | `""` | API Server 地址；单独设置时忽略 `~/.kube/config` |
| `kubeConfigPath` | `""` | kubeconfig 文件路径 |
| `token` | `""` | Bearer Token |
| `maxItems` | `1000` | 单次列表请求向 API Server 申请的条目上限（`limit`） |

所有字符串属性都支持 `${...}` 占位符，凭据放在配置里：

```java
@EruptK8s(apiVersion = "apps/v1", kind = "Deployment", namespace = "${k8s.namespace:default}",
          masterUrl = "${k8s.master-url:}", token = "${K8S_TOKEN:}")
```

`kubeConfigPath` / `masterUrl` / `token` 均为空时，走标准发现链：`KUBECONFIG` 环境变量 → `~/.kube/config` → 集群内 ServiceAccount。

## @EruptK8sField 注解（字段级）

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `value` | — | 资源内的 JSON 路径，如 `spec.replicas`、`status.phase`、`spec.template.spec.containers[0].image`。点号分隔对象键，`[n]` 索引数组 |
| `fieldSelector` | `false` | API Server 能按该路径过滤（`kubectl get --field-selector`）：字段上的等于 / 不等于搜索会作为 field selector 发给服务端，列表保持服务端分页。每种资源只有少数路径支持，如 Pod 的 `spec.nodeName`、`status.phase`；标在不支持的路径上 API Server 会拒绝列表请求 |

以下字段名无需 `@EruptK8sField` 即自动解析：

| 字段名 | 取值 |
| --- | --- |
| `name`、`namespace`、`uid`、`resourceVersion`、`creationTimestamp`、`labels`、`annotations` | `metadata.*` |
| `kind`、`apiVersion`、`metadata`、`spec`、`status` | 顶层对象 |
| `qualifiedName`（`EruptK8sDataService.QUALIFIED_NAME`） | `namespace/name`，`namespace = "*"` 模型的主键 |
| `yaml`（`EruptK8sDataService.YAML`） | 资源清单；仅详情页填充，新增 / 修改时写入 |
| `labelSelector`（`EruptK8sDataService.LABEL_SELECTOR`） | 仅用于搜索；值作为 label selector 发给 API Server |

> `metadata.generation` 已被读入资源数据，但**不在**上述快捷名单中，字段直接命名为 `generation` 取不到值，需显式声明 `@EruptK8sField("metadata.generation")`。

## 示例一：Deployment 看板（YAML 编辑 + 扩缩容）

```java
@Getter
@Setter
@Erupt(name = "Deployments", primaryKeyCol = "name", rowOperation = {
        @RowOperation(code = "scale", title = "扩缩容", mode = RowOperation.Mode.SINGLE,
                eruptClass = K8sScaleForm.class, operationHandler = K8sScaleHandler.class),
        @RowOperation(code = "restart", title = "滚动重启", operationHandler = K8sRestartHandler.class)
})
@EruptK8s(apiVersion = "apps/v1", kind = "Deployment", namespace = "default")
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sDeployment {

    @EruptField(views = @View(title = "名称"))
    private String name;

    @EruptK8sField("spec.replicas")
    @EruptField(views = @View(title = "副本数"))
    private Integer replicas;

    @EruptK8sField("status.readyReplicas")
    @EruptField(views = @View(title = "就绪数"))
    private Integer readyReplicas;

    @EruptK8sField("spec.template.spec.containers[0].image")
    @EruptField(views = @View(title = "镜像"))
    private String image;

    @EruptField(edit = @Edit(title = "Label Selector", search = @Search))
    private String labelSelector;

    // 只进表单不进列表：列表跳过它，编辑表单加载线上清单
    @EruptField(edit = @Edit(title = "YAML", notNull = true, type = EditType.CODE_EDITOR,
            codeEditType = @CodeEditorType(language = "yaml", height = 520)))
    private String yaml;
}
```

新增时清单的 `apiVersion` / `kind` 必须与模型一致；清单没写命名空间则落到模型的命名空间，写了别的命名空间会被拒绝。修改以替换方式提交，清单里的 `resourceVersion` 让写入成为乐观锁：基于过期读取的修改会失败，而不是覆盖别人的改动。

## 示例二：跨命名空间的 Pod 状态板（带日志）

```java
@Getter
@Setter
@Erupt(name = "Pods", primaryKeyCol = EruptK8sDataService.QUALIFIED_NAME,
        power = @Power(add = false, edit = false),
        rowOperation = @RowOperation(code = "logs", title = "日志", mode = RowOperation.Mode.SINGLE,
                callHint = "", operationParam = "500", operationHandler = K8sPodLogHandler.class))
@EruptK8s(apiVersion = "v1", kind = "Pod", namespace = "*")
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sPod {

    @EruptField(views = @View(title = "Pod"))
    private String qualifiedName;

    @EruptField(views = @View(title = "命名空间"), edit = @Edit(title = "命名空间", search = @Search,
            type = EditType.CHOICE, choiceType = @ChoiceType(fetchHandler = K8sNamespaceFetchHandler.class,
            fetchHandlerParams = "K8sPod")))
    private String namespace;

    @EruptK8sField(value = "status.phase", fieldSelector = true)
    @EruptField(views = @View(title = "阶段"), edit = @Edit(title = "阶段", search = @Search))
    private String phase;

    @EruptK8sField(value = "spec.nodeName", fieldSelector = true)
    @EruptField(views = @View(title = "节点"), edit = @Edit(title = "节点", search = @Search))
    private String node;

    @EruptK8sField("status.containerStatuses[0].restartCount")
    @EruptField(views = @View(title = "重启次数"))
    private Integer restarts;
}
```

## 内置行操作

| 操作 | Handler | 对应 kubectl |
| --- | --- | --- |
| 扩缩容 | `K8sScaleHandler` + 表单 `K8sScaleForm`，打开时带出当前副本数 | `kubectl scale` |
| 滚动重启 | `K8sRestartHandler`，给 Pod 模板打 `kubectl.kubernetes.io/restartedAt` 注解 | `kubectl rollout restart` |
| 查看 YAML | `K8sYamlHandler`，只读抽屉，适合没有 `yaml` 字段的模型 | `kubectl get -o yaml` |
| Pod 日志 | `K8sPodLogHandler`，取最后 N 行（`operationParam`，默认 500，上限 10000），多容器合并展示 | `kubectl logs --tail` |
| 命名空间下拉 | `K8sNamespaceFetchHandler`，`fetchHandlerParams` 填模型的 erupt 名 | — |

扩缩容与重启都是对主资源打 JSON merge patch，因此凡是有 `spec.replicas` 或 `spec.template` 的资源类型都适用，包括自定义资源。

实时日志与 Web 终端不在本模块中，由 [erupt-k8s-dashboard](/zh/modules/apps/erupt-k8s-dashboard) 提供。

## 分页与服务端筛选

列表按代价从低到高分三条路径回答：

1. **按主键查询**（权限校验、行操作都这样问）：一次 `GET`，不发列表请求。
2. **只有命名空间、label selector、field selector，且不排序**：由 API Server 以 `limit` / `continue` 游标分页，每页只读一页资源，集群再大也一样。`continue` 令牌按查询缓存约 4 分钟，翻页时直接从上一页接着读；令牌过期（410 Gone）会自动从第一页重读。
3. **其他情况**（内存筛选条件、排序、`@Erupt(orderBy)`）：最多读 `maxItems` 条，再在内存中筛选 / 排序 / 分页。

服务端分页时的总数来自 API Server 的 `remainingItemCount`；带 label selector 时服务端不计数，此时只承诺「还有一页」，分页器的总页数会随翻页增长。

:::tip 让列表留在服务端
- `namespace` 等值搜索与 `labelSelector` 永远发给 API Server。
- 标了 `@EruptK8sField(fieldSelector = true)` 的字段，等于 / 不等于搜索会作为 field selector 发送；其余表达式（模糊、区间、IN）仍走内存筛选，列表随之退回第 3 条路径。
- 搜索栏里只要出现一个内存条件，整个列表就退回 `maxItems` 内的内存处理，所以大集群上尽量用命名空间与 selector 收窄。
:::

## 操作支持

- **列表**：见上方三条路径
- **详情**：按 `name` 或 `namespace/name` 一次 `GET`；固定命名空间的模型拒绝指向其他命名空间的 id
- **删除**：按 id 删除
- **新增 / 修改**：模型声明 `yaml` 字段后可用，提交整份清单；没有该字段则抛出只读错误

:::warning 注意
- 主键值即资源名称；跨命名空间（`namespace = "*"`）的模型请用 `qualifiedName` 作主键，否则同名资源会互相覆盖。
- 集群级资源（Node、PersistentVolume、ClusterRole 等）`namespace` 留空。
- `maxItems` 作为 `limit` 发给 API Server，服务端最多返回这么多条，超出部分静默截断；经常触顶时请按命名空间或 selector 收窄，或调大该值。
:::

:::warning 只读是「提交时报错」，不是按钮消失
没有 `yaml` 字段的模型，`addData` / `editData` 直接抛出异常，但服务**没有覆写 `power()`**。因此后台列表上的「新增」「修改」按钮照常渲染，用户填完表单点提交才会看到报错。

请在模型上显式关闭这两项权限：

```java
@Erupt(
    name = "Pods",
    primaryKeyCol = "name",
    power = @Power(add = false, edit = false)
)
```

需要连删除一起禁掉时再加上 `delete = false`。
:::
