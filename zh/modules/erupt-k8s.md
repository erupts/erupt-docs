# Erupt Kubernetes 数据源

erupt-data-k8s 模块基于 fabric8 kubernetes-client 提供 Kubernetes 数据源支持。将 `@Erupt` 模型绑定到一种资源类型（Pod、Deployment、Service、ConfigMap、Node、CustomResource 等），即可获得可筛选、可搜索、带权限控制的资源管理视图，并支持从资源嵌套的 spec / status 中提取任意字段。

**只读 + 删除。** 不支持新增和修改：通过表单构造 K8s spec 远不如直接编写 YAML 可靠。

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
| `namespace` | `""` | 目标命名空间，为空表示集群级资源或全部命名空间 |
| `masterUrl` | `""` | Master 地址覆盖 |
| `kubeConfigPath` | `""` | kubeconfig 文件路径 |
| `token` | `""` | Bearer Token 覆盖 |
| `maxItems` | `1000` | 单次列表调用的条目数上限 |

`kubeConfigPath` / `masterUrl` / `token` 均为空时，走标准发现链：`KUBECONFIG` 环境变量 → `~/.kube/config` → 集群内 ServiceAccount。

## @EruptK8sField 注解（字段级）

将模型字段映射到资源内的 JSON 路径，如 `spec.replicas`、`status.phase`、`spec.template.spec.containers[0].image`。点号分隔对象键，`[n]` 索引数组。

以下字段名无需 `@EruptK8sField` 即自动解析：

`name`、`namespace`、`uid`、`resourceVersion`、`creationTimestamp`、`labels`、`annotations`、`kind`、`apiVersion`、`metadata`、`spec`、`status`

## 示例一：Deployment 看板

```java
@Getter
@Setter
@Erupt(name = "Deployments", primaryKeyCol = "name")
@EruptK8s(
    apiVersion = "apps/v1",
    kind = "Deployment",
    namespace = "default",
    kubeConfigPath = "/Users/me/.kube/config"
)
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sDeployment {

    @EruptField(views = @View(title = "名称"))
    private String name;

    @EruptField(views = @View(title = "命名空间"))
    private String namespace;

    @EruptK8sField("spec.replicas")
    @EruptField(views = @View(title = "副本数"))
    private Integer replicas;

    @EruptK8sField("status.readyReplicas")
    @EruptField(views = @View(title = "就绪数"))
    private Integer readyReplicas;

    @EruptK8sField("spec.template.spec.containers[0].image")
    @EruptField(views = @View(title = "镜像"))
    private String image;

    @EruptField(views = @View(title = "创建时间"))
    private String creationTimestamp;
}
```

## 示例二：Pod 状态板

```java
@Getter
@Setter
@Erupt(name = "Pods", primaryKeyCol = "name")
@EruptK8s(apiVersion = "v1", kind = "Pod", namespace = "prod")
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sPod {

    @EruptField(views = @View(title = "名称"))
    private String name;

    @EruptK8sField("status.phase")
    @EruptField(views = @View(title = "阶段"), edit = @Edit(search = @Search))
    private String phase;

    @EruptK8sField("spec.nodeName")
    @EruptField(views = @View(title = "节点"))
    private String node;

    @EruptK8sField("status.containerStatuses[0].restartCount")
    @EruptField(views = @View(title = "重启次数"))
    private Integer restarts;

    @EruptK8sField("status.podIP")
    @EruptField(views = @View(title = "IP"))
    private String podIp;
}
```

## 操作支持

- **列表**：拉取该类型全部资源（受 `maxItems` 限制），在内存中筛选 / 排序 / 分页
- **详情**：`withName(id).get()`，以资源名作为主键
- **删除**：`withName(id).delete()`
- **新增 / 修改**：不支持

:::warning 注意
- 主键值即资源名称，模型主键列应对应 `metadata.name`（或直接命名为 `name` 的字段）。
- 集群级资源（Node、PersistentVolume、ClusterRole 等）`namespace` 留空。
- 超过 `maxItems` 会静默截断，如经常触顶请调大该值或按命名空间拆分模型。
:::
