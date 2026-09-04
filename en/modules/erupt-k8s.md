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

> `metadata.generation` is read into the resource data but is **not** in the shortcut list above — a field simply named `generation` resolves to null. Declare it explicitly with `@EruptK8sField("metadata.generation")`.

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

    @EruptField(views = @View(title = "Name"))
    private String name;

    @EruptField(views = @View(title = "Namespace"))
    private String namespace;

    @EruptK8sField("spec.replicas")
    @EruptField(views = @View(title = "Replicas"))
    private Integer replicas;

    @EruptK8sField("status.readyReplicas")
    @EruptField(views = @View(title = "Ready"))
    private Integer readyReplicas;

    @EruptK8sField("spec.template.spec.containers[0].image")
    @EruptField(views = @View(title = "Image"))
    private String image;

    @EruptField(views = @View(title = "Created At"))
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

    @EruptField(views = @View(title = "Name"))
    private String name;

    @EruptK8sField("status.phase")
    @EruptField(views = @View(title = "Phase"), edit = @Edit(search = @Search))
    private String phase;

    @EruptK8sField("spec.nodeName")
    @EruptField(views = @View(title = "Node"))
    private String node;

    @EruptK8sField("status.containerStatuses[0].restartCount")
    @EruptField(views = @View(title = "Restarts"))
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
- `maxItems` truncates client-side only: fabric8's `list()` still pulls every resource of that type back to the JVM before the first N are kept. Lowering it saves memory, but not the cost of the API call.
:::

:::warning Read-only means "errors on submit", not "buttons hidden"
`addData` / `editData` throw outright, but the service does **not** override `power()` — no data source under erupt-data does. So the Add and Edit buttons still render in the admin list, and the user only sees the error after filling in the form and hitting submit.

Turn those two permissions off explicitly on the model:

```java
@Erupt(
    name = "Deployments",
    primaryKeyCol = "name",
    power = @Power(add = false, edit = false)
)
```

Add `delete = false` as well if you want to block deletes too.
:::
