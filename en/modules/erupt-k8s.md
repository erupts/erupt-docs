# Erupt Kubernetes Data Source

The erupt-data-k8s module provides a Kubernetes data source built on the fabric8 kubernetes-client. Bind an `@Erupt` model to a resource type (Pod, Deployment, Service, ConfigMap, Node, CustomResource, etc.) and you get a filterable, searchable, permission-controlled resource management view, with support for extracting arbitrary fields from the resource's nested spec / status.

**Browse + delete out of the box, writes go through YAML.** Building a K8s spec out of form fields is far less reliable than writing the manifest, so a model that declares a `yaml` field creates and edits by submitting the whole manifest, the way `kubectl create` / `kubectl replace` do; a model without that field is read-only plus delete.

:::tip Don't want to write models?
[erupt-k8s-dashboard](/en/modules/apps/erupt-k8s-dashboard) is built on this module and ships an admin for Pods, Deployments and the other common kinds — add the dependency, get the menu. Use this module directly for resources it does not cover, such as custom resources.
:::

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
| `namespace` | `""` | Fixed namespace; `"*"` spans every namespace; empty means a cluster-scoped kind, or the client's default namespace |
| `masterUrl` | `""` | API server URL; set alone, the client ignores `~/.kube/config` |
| `kubeConfigPath` | `""` | Path to a kubeconfig file |
| `token` | `""` | Bearer token |
| `maxItems` | `1000` | Item cap requested from the API server per list call (`limit`) |

Every string attribute accepts `${...}` placeholders, so credentials stay in configuration:

```java
@EruptK8s(apiVersion = "apps/v1", kind = "Deployment", namespace = "${k8s.namespace:default}",
          masterUrl = "${k8s.master-url:}", token = "${K8S_TOKEN:}")
```

When `kubeConfigPath` / `masterUrl` / `token` are all empty, the standard discovery chain applies: `KUBECONFIG` environment variable → `~/.kube/config` → in-cluster ServiceAccount.

## The @EruptK8sField Annotation (field level)

| Attribute | Default | Description |
| --- | --- | --- |
| `value` | — | JSON path inside the resource, e.g. `spec.replicas`, `status.phase`, `spec.template.spec.containers[0].image`. Dots separate object keys; `[n]` indexes into arrays |
| `fieldSelector` | `false` | The API server can filter on this path (`kubectl get --field-selector`): an equals or not-equals search on the field is sent as a field selector, so the list stays paged on the server. Only a few paths per kind qualify, e.g. a Pod's `spec.nodeName` and `status.phase`; marking any other path makes the API server refuse the list |

The following field names resolve automatically without `@EruptK8sField`:

| Field | Value |
| --- | --- |
| `name`, `namespace`, `uid`, `resourceVersion`, `creationTimestamp`, `labels`, `annotations` | `metadata.*` |
| `kind`, `apiVersion`, `metadata`, `spec`, `status` | top-level sections |
| `qualifiedName` (`EruptK8sDataService.QUALIFIED_NAME`) | `namespace/name`; the primary key for `namespace = "*"` models |
| `yaml` (`EruptK8sDataService.YAML`) | the manifest; filled in the detail view only, written on add and edit |
| `labelSelector` (`EruptK8sDataService.LABEL_SELECTOR`) | search-only; the value is sent to the API server as the label selector |

> `metadata.generation` is read into the resource data but is **not** in the shortcut list above — a field simply named `generation` resolves to null. Declare it explicitly with `@EruptK8sField("metadata.generation")`.

## Example 1: Deployment Dashboard (YAML editing + scaling)

```java
@Getter
@Setter
@Erupt(name = "Deployments", primaryKeyCol = "name", rowOperation = {
        @RowOperation(code = "scale", title = "Scale", mode = RowOperation.Mode.SINGLE,
                eruptClass = K8sScaleForm.class, operationHandler = K8sScaleHandler.class),
        @RowOperation(code = "restart", title = "Restart", operationHandler = K8sRestartHandler.class)
})
@EruptK8s(apiVersion = "apps/v1", kind = "Deployment", namespace = "default")
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sDeployment {

    @EruptField(views = @View(title = "Name"))
    private String name;

    @EruptK8sField("spec.replicas")
    @EruptField(views = @View(title = "Replicas"))
    private Integer replicas;

    @EruptK8sField("status.readyReplicas")
    @EruptField(views = @View(title = "Ready"))
    private Integer readyReplicas;

    @EruptK8sField("spec.template.spec.containers[0].image")
    @EruptField(views = @View(title = "Image"))
    private String image;

    @EruptField(edit = @Edit(title = "Label selector", search = @Search))
    private String labelSelector;

    // Form only, no column: lists skip it, the edit form loads the live manifest
    @EruptField(edit = @Edit(title = "YAML", notNull = true, type = EditType.CODE_EDITOR,
            codeEditType = @CodeEditorType(language = "yaml", height = 520)))
    private String yaml;
}
```

Add takes a manifest of the model's own `apiVersion` / `kind`. A manifest without a namespace lands in the model's namespace, and one naming another namespace is refused. Edit sends the manifest as a replace; its `resourceVersion` makes the write optimistic, so an edit based on a stale read fails rather than overwriting someone else's change.

## Example 2: Pods Across Namespaces (with logs)

```java
@Getter
@Setter
@Erupt(name = "Pods", primaryKeyCol = EruptK8sDataService.QUALIFIED_NAME,
        power = @Power(add = false, edit = false),
        rowOperation = @RowOperation(code = "logs", title = "Logs", mode = RowOperation.Mode.SINGLE,
                callHint = "", operationParam = "500", operationHandler = K8sPodLogHandler.class))
@EruptK8s(apiVersion = "v1", kind = "Pod", namespace = "*")
@EruptDataProcessor(EruptK8sDataService.DATA_PROCESSOR)
public class K8sPod {

    @EruptField(views = @View(title = "Pod"))
    private String qualifiedName;

    @EruptField(views = @View(title = "Namespace"), edit = @Edit(title = "Namespace", search = @Search,
            type = EditType.CHOICE, choiceType = @ChoiceType(fetchHandler = K8sNamespaceFetchHandler.class,
            fetchHandlerParams = "K8sPod")))
    private String namespace;

    @EruptK8sField(value = "status.phase", fieldSelector = true)
    @EruptField(views = @View(title = "Phase"), edit = @Edit(title = "Phase", search = @Search))
    private String phase;

    @EruptK8sField(value = "spec.nodeName", fieldSelector = true)
    @EruptField(views = @View(title = "Node"), edit = @Edit(title = "Node", search = @Search))
    private String node;

    @EruptK8sField("status.containerStatuses[0].restartCount")
    @EruptField(views = @View(title = "Restarts"))
    private Integer restarts;
}
```

## Built-in Row Operations

| Operation | Handler | kubectl equivalent |
| --- | --- | --- |
| Scale | `K8sScaleHandler` with the `K8sScaleForm` form, opened with the current replica count | `kubectl scale` |
| Rollout restart | `K8sRestartHandler`, stamps the pod template with `kubectl.kubernetes.io/restartedAt` | `kubectl rollout restart` |
| View YAML | `K8sYamlHandler`, read-only drawer for models without a `yaml` field | `kubectl get -o yaml` |
| Pod logs | `K8sPodLogHandler`, last N lines (`operationParam`, default 500, max 10000), every container in one drawer | `kubectl logs --tail` |
| Namespace dropdown | `K8sNamespaceFetchHandler`, with the model's erupt name as `fetchHandlerParams` | — |

Scale and restart both send a JSON merge patch on the main resource, so they work on any kind with `spec.replicas` or `spec.template`, custom resources included.

Live logs and the web terminal are not part of this module; they come with [erupt-k8s-dashboard](/en/modules/apps/erupt-k8s-dashboard).

## Paging and Server-side Filtering

A list is answered in one of three ways, cheapest first:

1. **A primary-key condition** (scope checks and row operations ask this way): a single `GET`, no list call.
2. **Only namespace, label selector and field selectors, no sort**: the API server pages with `limit` / `continue` cursors, so a page reads one page of resources however many the cluster holds. `continue` tokens are cached per query for about 4 minutes, so the next page carries on from the previous one; an expired token (410 Gone) triggers a re-read from the first page.
3. **Anything else** (in-memory conditions, sorting, `@Erupt(orderBy)`): up to `maxItems` resources are read, then filtered, sorted and paged in memory.

Under server-side paging the total comes from the API server's `remainingItemCount`; with a label selector the server does not count, so the list only promises "one more page" and the paginator grows as you page through.

:::tip Keeping the list on the server
- An equality search on `namespace` and the `labelSelector` always go to the API server.
- On fields marked `@EruptK8sField(fieldSelector = true)`, equals / not-equals searches are sent as field selectors; other expressions (fuzzy, range, IN) still filter in memory and drop the list back to path 3.
- A single in-memory condition in the search bar pushes the whole list back to in-memory handling within `maxItems`, so narrow large clusters by namespace and selectors.
:::

## Supported Operations

- **List**: the three paths above
- **Detail**: a single `GET` by `name` or `namespace/name`; a fixed-namespace model refuses ids pointing at another namespace
- **Delete**: by id
- **Add / Edit**: available once the model declares a `yaml` field, submitting the whole manifest; without it a read-only error is raised

:::warning Note
- The primary key value is the resource name; models spanning namespaces (`namespace = "*"`) should use `qualifiedName` as the primary key, otherwise same-named resources collide.
- Leave `namespace` empty for cluster-scoped resources (Node, PersistentVolume, ClusterRole, etc.).
- `maxItems` is sent to the API server as `limit`; the server returns at most that many and anything beyond is silently truncated. If you hit the cap regularly, narrow by namespace or selectors, or raise the value.
:::

:::warning Read-only means "errors on submit", not "buttons hidden"
For a model without a `yaml` field, `addData` / `editData` throw outright, but the service does **not** override `power()`. So the Add and Edit buttons still render in the admin list, and the user only sees the error after filling in the form and hitting submit.

Turn those two permissions off explicitly on the model:

```java
@Erupt(
    name = "Pods",
    primaryKeyCol = "name",
    power = @Power(add = false, edit = false)
)
```

Add `delete = false` as well if you want to block deletes too.
:::
