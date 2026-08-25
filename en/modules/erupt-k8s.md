# Erupt Kubernetes Data Source

The erupt-data-k8s module provides a Kubernetes data source built on the fabric8 kubernetes-client. Bind an `@Erupt` model to a resource type (Pod, Deployment, Service, ConfigMap, Node, CustomResource, etc.) and you get a filterable, searchable, permission-controlled resource management view, with support for extracting arbitrary fields from the resource's nested spec / status.

**Read-only + delete.** Add and edit are not supported: building a K8s spec through a form is far less reliable than writing YAML directly.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-k8s</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## The @EruptK8s Annotation (class level)

| Attribute | Default | Description |
| --- | --- | --- |
| `apiVersion` | — | API group / version, e.g. `v1`, `apps/v1`, `batch/v1` |
| `kind` | — | Resource type, e.g. `Pod`, `Deployment`, `ConfigMap` |
| `namespace` | `""` | Target namespace; empty means a cluster-scoped resource or all namespaces |
| `masterUrl` | `""` | Master URL override |
| `kubeConfigPath` | `""` | Path to a kubeconfig file |
| `token` | `""` | Bearer token override |
| `maxItems` | `1000` | Maximum number of items per list call |

When `kubeConfigPath` / `masterUrl` / `token` are all empty, the standard discovery chain applies: `KUBECONFIG` environment variable → `~/.kube/config` → in-cluster ServiceAccount.

## The @EruptK8sField Annotation (field level)

Maps a model field to a JSON path inside the resource, e.g. `spec.replicas`, `status.phase`, `spec.template.spec.containers[0].image`. Dots separate object keys; `[n]` indexes into arrays.

The following field names resolve automatically without `@EruptK8sField`:

`name`, `namespace`, `uid`, `resourceVersion`, `creationTimestamp`, `labels`, `annotations`, `kind`, `apiVersion`, `metadata`, `spec`, `status`

## Example 1: Deployment Dashboard

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

## Example 2: Pod Status Board

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

## Supported Operations

- **List**: fetches all resources of the type (capped by `maxItems`), then filters / sorts / paginates in memory
- **Detail**: `withName(id).get()`, using the resource name as the primary key
- **Delete**: `withName(id).delete()`
- **Add / Edit**: not supported

:::warning Note
- The primary key value is the resource name; the model's primary key column should map to `metadata.name` (or simply be a field named `name`).
- Leave `namespace` empty for cluster-scoped resources (Node, PersistentVolume, ClusterRole, etc.).
- Results beyond `maxItems` are silently truncated — if you hit the cap regularly, raise the value or split the model by namespace.
:::
