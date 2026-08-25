# Erupt AI Canvas <Badge type="tip" text="v2.1.0+" />

:::info
**一句话生成一个页面。** 用自然语言描述需求，AI Canvas 生成完整页面，数据实时来自 Erupt 后端，无需前端、无需部署。
:::

## 模块简介

AI Canvas 是构建在 [erupt-ai](/zh/modules/erupt-ai) 之上的 AI 页面生成模块：在设计器中选择数据模型、描述页面需求，大模型即输出一个完整的 HTML 页面（Vue 3 + Element Plus 实时渲染），页面通过内置 SDK 直连 Erupt REST API 读取**真实数据**，生成结果存入数据库，可一键发布为后台菜单。

<img src="/ai-canvas/ai-canvas.png" width="900" alt="一句话生成实时数据仪表盘">

核心能力：

- **流式生成**：SSE 逐字输出生成过程，随时可中止
- **版本管理**：每次生成都是一个版本，可切换 / 激活任意历史版本
- **元素拾取修改**：悬停选中页面元素，告诉 AI 改哪里（精确到 CSS 选择器路径）
- **三种设备预览**：桌面 / 平板 / 手机视口切换
- **数据实时直连**：生成页面通过 Erupt REST API 读取真实数据，Vue 3 实时渲染
- **一键发布到菜单**：发布后成为后台菜单页面，走 Erupt 原生权限体系
- **聊天模型可选**：在设计器中为每个画布单独指定生成所用的大模型
- **查询自校验（ReAct）**：生成过程中 AI 会先调用校验工具真实执行查询，验证通过后才写入页面，杜绝"看起来能跑"的假代码

## 引入方式

```xml
<!-- 2.1.0 及以上版本支持 -->
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-canvas</artifactId>
    <version>${LATEST}</version>
</dependency>
```

模块依赖 `erupt-ai`（大模型配置）与 `erupt-upms`（菜单与权限），并自带 Vue 3 / Element Plus / axios 前端资源，均随依赖自动引入，无需额外配置。

:::warning
使用前需在 erupt-ai 的 **LLM 菜单** 中配置至少一个可用的大模型，并设置默认模型，详见 [Erupt AI 快速接入](/zh/modules/erupt-ai#快速接入)。
:::

## 快速开始

1. 添加依赖并启动应用，后台会自动出现 **AI Canvas** 菜单；
2. 在 AI Canvas 列表中新增一条记录（填写名称即可，`Code` 由系统自动生成，为 6 位唯一短码）；
3. 点击行操作中的 **Designer（设计器）** 进入可视化设计界面；
4. 在设计器中选择数据源类型与数据模型、页面风格（可选）、聊天模型（可选，默认使用 erupt-ai 中的默认模型）；
5. 用自然语言描述页面需求，例如"生成一个商品列表页，支持按名称搜索、按创建时间倒序"，AI 将流式生成页面并实时预览。

列表中的 **Path** 列可直接打开全屏预览（路由为 `#/fill/ai/canvas/{code}`）。

<img src="/ai-canvas/ai-canvas3.png" width="900" alt="终端绿风格的用户卡片视图页面">

:::tip
生成的页面读取数据时使用**访问者本人的登录令牌**调用 Erupt 数据接口，因此数据权限始终跟随当前登录用户，不会越权。
:::

## 核心能力

### 流式生成

设计器通过 SSE（`text/event-stream`）逐字输出生成过程，包括 AI 的查询校验动作（工具调用事件）与页面代码内容。生成过程中可随时点击停止：

- **主动停止**：当前轮次被丢弃，不产生版本；
- **意外断开**（如刷新页面、网络抖动）：生成结果仍会在后台持久化为新版本，重新进入设计器即可看到。

SSE 超时时间由 erupt-ai 的 `erupt.ai.sse-timeout` 配置控制（默认 15 分钟）。

### 版本管理

每一轮生成都会追加一条版本记录，包含本轮的需求描述、数据源与风格快照、完整页面源码。设计器中可查看全部历史版本，并**激活**任意版本——激活后该版本的 HTML 成为对外服务的页面内容。

<img src="/ai-canvas/ai-canvas2.png" width="900" alt="多轮生成的版本列表与激活切换">

:::info
对当前页面 HTML 的手工微调会保留至下一次生成；每次生成均以当前页面源码为基准做修订，而非重放历史需求。
:::

### 元素拾取修改

在预览区悬停并选中某个页面元素后再描述需求，AI 将收到该元素的 **CSS 选择器路径**，仅对选中元素做精确修改，页面其余部分保持不动，避免"改一处、动全身"。

### 设备预览

设计器内置桌面 / 平板 / 手机三种视口切换，无需离开设计器即可验证页面的响应式表现。

### 发布到菜单与访问

在 AI Canvas 列表的行操作中点击 **Send to Menu（发布到菜单）**，填写菜单名称与上级菜单后，页面即成为一个类型为 `aiCanvas` 的后台菜单项（菜单值为画布的 `code`），并走 Erupt 原生菜单权限——只有被授权该菜单的角色才能访问。

访问链路：前端路由 `#/ai/canvas/{code}` 以 iframe 方式嵌入页面，页面 HTML 由接口 `erupt-api/ai-canvas/html/{code}` 返回（需登录鉴权），服务端会自动注入访问者令牌与页面 SDK。将画布的 **Enable** 开关关闭可临时下线页面，无需删除菜单。

## 扩展点：CanvasModelProvider

数据源以 `CanvasModelProvider` 接口扩展，实现类注册为 Spring Bean 即自动生效。内置实现 `EruptCanvasModelProvider`（类型 `erupt`）提供全部 Erupt 模型作为数据源。

```java
public interface CanvasModelProvider {

    // 数据源类型编码，展示在设计器中，如 'erupt'
    String type();

    // 该数据源下可选择的模型列表
    List<VLModel> models();

    // 单个模型的结构描述，注入生成提示词
    String describe(String model);

    // 教会 LLM 页面如何查询该数据源（SDK 函数、数据形态），Markdown 格式
    String queryGuide();

    // 携带 langchain4j @Tool 方法的对象，供生成过程中校验查询是否可用（ReAct）；
    // 返回 null 表示关闭校验
    default Object verifyTool() {
        return null;
    }
}
```

内置的 `erupt` 数据源为生成页面提供全局 `Erupt` SDK 对象（`Erupt.table` / `Erupt.row` / `Erupt.tree` / `Erupt.choice` 以及需求明确要求时的 `Erupt.add` / `Erupt.update` / `Erupt.remove`），并在生成阶段通过以下校验工具让 AI 先验证再落笔：

| 校验工具 | 说明 |
|---|---|
| `verifyTableQuery` | 真实执行页面将运行的分页查询，验证条件、排序、字段编码是否正确 |
| `getModelStructure` | 获取任意 Erupt 模型的结构 JSON（跨模型引用时使用） |
| `getChoiceOptions` | 获取 CHOICE / MULTI_CHOICE 字段的选项列表 |

:::info
内置 `erupt` 数据源返回的是分页明细数据，**不具备聚合统计能力**，因此生成页面不会包含基于分页数据伪造的汇总、图表类统计组件；如需统计分析类页面，可通过自定义 `CanvasModelProvider` 对接具备聚合能力的数据源。
:::

## 相关配置

模块本身无独立配置项，生成行为复用 erupt-ai 的配置：

```yaml
erupt:
  ai:
    # SSE 超时时间（毫秒），即单轮生成允许的最长时间，默认 15 分钟
    sse-timeout: 900000
```

大模型的接入与默认模型设置均在 erupt-ai 的 LLM 菜单中完成，详见 [Erupt AI 大模型深度集成](/zh/modules/erupt-ai)。
