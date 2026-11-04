# Erupt K8s Dashboard: a Ready-made Kubernetes Admin

[erupt-k8s-dashboard](https://github.com/erupt-io/erupt-k8s-dashboard) is a separate repository built on [erupt-data-k8s](/en/modules/erupt-k8s): add the dependency and a **Kubernetes** menu appears with the common resources, already wired with logs, a web terminal, scaling, rollout restarts and YAML editing. You write no models and no annotations.

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-k8s-dashboard</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

Needs erupt 2.4.0 or newer. To model a resource the dashboard does not ship, such as a custom resource, use `@EruptK8s` from [erupt-data-k8s](/en/modules/erupt-k8s) directly.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

The dashboard runs on its own with an H2 file database under `./h2` and reads `~/.kube/config`, so whatever `kubectl` sees, the Workspace picker offers.

## Built-in menus

| Menu | Kind | Actions |
| --- | --- | --- |
| Pods | Pod | Logs, Follow logs, Terminal, YAML, delete |
| Deployments | Deployment | Scale, Restart, create / edit from YAML, delete |
| Stateful Sets | StatefulSet | Scale, Restart, create / edit from YAML, delete |
| Daemon Sets | DaemonSet | Restart, create / edit from YAML, delete |
| Services | Service | create / edit from YAML, delete |
| Config Maps | ConfigMap | create / edit from YAML, delete |
| Events | Event | read only |
| Namespaces | Namespace | read only, YAML |
| Nodes | Node | read only, YAML |

Each resource is its own menu, so roles grant them one by one. **The terminal is a separate grant** (the `TERMINAL` button on the Pods menu): users without that button get no Terminal action, and the server refuses to render the terminal page for them.

## Workspace: the current cluster and namespace

The **Workspace** picker in the header decides which cluster and namespace every Kubernetes page looks at:

- **Cluster** lists the contexts of the kubeconfig, current context first and used as the default, so `kubectl config use-context` is no longer needed.
- **Namespace** is optional; leave it empty to see every namespace. A picked namespace filters the namespaced pages, hides their namespace search and column, and new resources land in it.

Each browser window keeps its own Workspace, so two windows can look at two clusters. The pick travels with every request in the `erupt-scope` header, and the server checks it against the options the user was offered. The Workspace is Erupt's [@EruptScope](/en/annotation/erupt-scope) feature; `KubeScope` is a plain Erupt form.

## Cluster connection

By default the standard client chain applies: `KUBECONFIG` → `~/.kube/config` → in-cluster ServiceAccount. To read another file, or to pin one cluster:

```yaml
erupt:
  k8s-dashboard:
    kubeconfig: /etc/erupt/kubeconfig   # its contexts become the Workspace clusters, or:
    master-url: https://10.0.0.1:6443   # a single cluster, no switching
    token: ${K8S_TOKEN}                 # keep it in the environment, never in the file
```

Setting `master-url` without `kubeconfig` ignores `~/.kube/config`. The dashboard can do no more than its credentials allow, so give it a ServiceAccount scoped to what your admins should touch.

## Web terminal

The terminal opens in a bottom drawer: **Terminal** runs `bash`, or `sh` when the image has no bash; **Follow logs** streams the last 500 lines and then follows; a Pod with several containers gets a container switcher.

- **Socket path**: the WebSocket listens on `/erupt-k8s-terminal`; a reverse proxy in front of Erupt must pass upgrade requests on that path.
- **One-time tickets**: the page carries tickets that expire after 60 seconds, bound to the user's session, the Pod and the container; the socket never takes a Pod name from the browser. Reopen the action to reconnect.
- **Offline**: xterm.js is bundled in the jar (`/erupt-k8s-dashboard/xterm/`), so the terminal works without internet access.

:::info Why the terminal is not in erupt-data-k8s
The data source only reads resources into models; the terminal needs a WebSocket, tickets and its own permission point, which belong to the admin. erupt-data-k8s stays a pure data source, and the terminal ships with erupt-k8s-dashboard.
:::
