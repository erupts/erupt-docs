# Erupt K8s Dashboard 开箱即用的 Kubernetes 管理台

[erupt-k8s-dashboard](https://github.com/erupt-io/erupt-k8s-dashboard) 是基于 [erupt-data-k8s](/zh/modules/erupt-k8s) 的独立仓库：加上依赖，后台就多出一个 **Kubernetes** 菜单，常用资源连同日志、Web 终端、扩缩容、滚动重启与 YAML 编辑一并就位，不用写任何模型与注解。

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-k8s-dashboard</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

需要 erupt 2.4.0 及以上。要给管理台没有内置的资源（如自定义资源）建模，直接用 [erupt-data-k8s](/zh/modules/erupt-k8s) 的 `@EruptK8s`。

## 本地试用

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

管理台可独立运行：使用 `./h2` 下的 H2 文件库，读取 `~/.kube/config`，`kubectl` 能看到的集群都会出现在 Workspace 选择器里。

## 内置菜单

| 菜单 | Kind | 操作 |
| --- | --- | --- |
| Pods | Pod | 日志、实时日志、终端、YAML、删除 |
| Deployments | Deployment | 扩缩容、重启、YAML 新增 / 编辑、删除 |
| Stateful Sets | StatefulSet | 扩缩容、重启、YAML 新增 / 编辑、删除 |
| Daemon Sets | DaemonSet | 重启、YAML 新增 / 编辑、删除 |
| Services | Service | YAML 新增 / 编辑、删除 |
| Config Maps | ConfigMap | YAML 新增 / 编辑、删除 |
| Events | Event | 只读 |
| Namespaces | Namespace | 只读、YAML |
| Nodes | Node | 只读、YAML |

每个资源是独立菜单，角色按菜单逐项授权；**终端是单独的权限点**（Pods 菜单的 `TERMINAL` 按钮），没有该按钮的用户看不到终端操作，服务端也拒绝渲染终端页面。

## Workspace：当前集群与命名空间

页头的 **Workspace** 选择器决定所有 Kubernetes 页面看哪个集群、哪个命名空间：

- **集群**列出 kubeconfig 里的全部 context，当前 context 排在最前并作为默认值，不再需要 `kubectl config use-context`。
- **命名空间**可选；留空看全部命名空间，选定后带命名空间的页面只显示该命名空间，隐藏命名空间搜索与列，新建资源也落在其中。

每个浏览器窗口各自记住一份 Workspace，两个窗口可以看两个集群。选择随每次请求以 `erupt-scope` 头发送，服务端会校验它是否在用户被提供的选项之内。Workspace 基于 Erupt 的 [@EruptScope](/zh/annotation/erupt-scope) 实现，`KubeScope` 只是一个普通的 Erupt 表单。

## 集群连接

默认走标准客户端链：`KUBECONFIG` → `~/.kube/config` → 集群内 ServiceAccount。要读别的文件或固定一个集群：

```yaml
erupt:
  k8s-dashboard:
    kubeconfig: /etc/erupt/kubeconfig   # 其中的 context 成为 Workspace 的集群选项，或者：
    master-url: https://10.0.0.1:6443   # 单集群，不可切换
    token: ${K8S_TOKEN}                 # 放在环境变量里，不要写进文件
```

只设 `master-url` 而不设 `kubeconfig` 时忽略 `~/.kube/config`。管理台能做的事不会超过凭据允许的范围，请给它一个只覆盖管理员应当触碰资源的 ServiceAccount。

## Web 终端

终端在底部抽屉打开：**终端**运行 `bash`，镜像没有 bash 时退回 `sh`；**实时日志**先取最后 500 行再持续跟随；多容器 Pod 有容器切换器。

- **Socket 路径**：WebSocket 监听 `/erupt-k8s-terminal`，前置反向代理需放行该路径的 upgrade 请求。
- **一次性票据**：页面携带 60 秒过期的票据，绑定用户会话、Pod 与容器，socket 不从浏览器接收 Pod 名；重新打开操作即可重连。
- **离线可用**：xterm.js 打包在 jar 内（`/erupt-k8s-dashboard/xterm/`），无外网也能用。

:::info 终端为何不在 erupt-data-k8s 里
数据源只负责把资源读成模型；终端需要 WebSocket、票据与独立权限点，属于管理台的职责。erupt-data-k8s 保持为纯数据源，终端随 erupt-k8s-dashboard 一起提供。
:::
