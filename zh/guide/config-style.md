# 前端样式（app.css）

:::info 参数配置分为四篇
- [后端配置（application.yml）](/zh/guide/configuration)：`erupt-app`、`erupt`、`erupt.upms`、`erupt.redis-session`、`erupt.telemetry`
- [前端配置（app.js）](/zh/guide/config-frontend)：站点信息、Logo、外观默认值、PWA、路由与生命周期回调
- [前端样式（app.css）](/zh/guide/config-style)：覆盖或补充界面样式
- [自定义首页（home.html）](/zh/guide/config-home)：替换登录后的欢迎页
:::

`app.css` 用来覆盖框架默认样式或补充自己的样式。文件需手动创建，位置 `/resources/public/app.css`，与 `app.js` 同级；不存在时前端按默认样式运行。

## 加载方式

`index.html` 在框架样式之后动态引入 `app.css`，并附带随构建变化的缓存戳（`app.css?_=<hash>`），因此它的规则天然排在框架规则后面，修改后刷新页面即可看到效果，不需要重新构建前端。

分工建议：

| 想改什么 | 用什么 |
| --- | --- |
| 主题色、顶栏颜色、皮肤、菜单模式、登录页布局 | [app.js 的 `theme` 配置](/zh/guide/config-frontend)，不要写 CSS |
| 站点 Logo、标题、图标 | app.js 的 `logoPath` / `title` / `faviconPath` |
| 某个组件的间距、圆角、字体、隐藏某个按钮、自定义图标类 | `app.css` |
| 整个欢迎页 | [home.html](/zh/guide/config-home) |

## 选择器优先级

框架组件自带的样式优先级较高，覆盖时在选择器前加 `:root`（或 `html`）即可压过：

```css
/* 例：登录框加宽、加大圆角、顶部加一条主题色 */
:root layout-passport .lp-card {
    max-width: 420px;
    border-radius: 16px;
    border-top: 4px solid var(--ant-primary-color);
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18);
}
```

尽量避免 `!important`：框架在切换暗色、紧凑模式时会重新计算样式，`!important` 会让这些状态失效。

## 按主题与皮肤区分

外观状态都以 class 的形式挂在 `<html>` 上，`app.css` 可以据此写差异样式：

| `<html>` 上的 class | 含义 |
| --- | --- |
| `dark` | 暗色模式（跟随系统时也会实时切换） |
| `compact` | 紧凑模式 |
| `brutalist-theme` | Brutalist 皮肤 |
| `liquid-glass` | Liquid Glass 液态玻璃皮肤 |
| `workspace` | Workspace 皮肤 |
| `classic` | Classic 皮肤 |
| （无皮肤 class） | 默认皮肤 |

```css
/* 暗色模式下登录框换成深色玻璃 */
:root.dark layout-passport .lp-card {
    background: rgba(20, 20, 20, 0.72);
}

/* 只在 Workspace 皮肤下缩小侧栏字号 */
:root.workspace .alain-default__aside .sidebar-nav__item {
    font-size: 13px;
}
```

## 设计令牌（CSS 变量）

框架的颜色与字体都定义为 CSS 变量，并在暗色模式下自动切换取值。自定义样式请引用这些变量，而不是写死颜色，这样暗色、紧凑与各皮肤都会自动适配：

| 变量 | 用途 |
| --- | --- |
| `--ant-primary-color` | 主题色（来自 app.js `theme.primaryColor` 或用户选择） |
| `--erupt-bg-layout` | 页面 / 画布背景 |
| `--erupt-bg-container` | 卡片、面板、表头等容器背景 |
| `--erupt-bg-elevated` | 弹出层、浮动面板背景 |
| `--erupt-bg-spotlight` | 表头、斑马纹等轻微强调背景 |
| `--erupt-text` / `--erupt-text-secondary` / `--erupt-text-tertiary` / `--erupt-text-quaternary` | 四级文字颜色 |
| `--erupt-border` / `--erupt-border-secondary` | 边框 |
| `--erupt-fill` / `--erupt-fill-secondary` / `--erupt-fill-tertiary` | 悬停、按下、轨道等中性填充 |
| `--erupt-header-bg` / `--erupt-header-text` / `--erupt-header-fill` / `--erupt-header-active-bg` / `--erupt-header-border` | 顶栏配色，由顶栏颜色设置写入，一般不需要覆盖 |
| `--erupt-scrollbar-track` / `--erupt-scrollbar-thumb` | 滚动条 |
| `--erupt-font` / `--erupt-code-font` | 界面字体 / 等宽字体 |

变量本身也可以在 `app.css` 中覆盖，例如替换全局字体：

```css
:root {
    --erupt-font: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}
```

## 常用示例

**自定义图标类**：菜单、行操作等处的图标名都是 CSS class，可以在 `app.css` 里定义自己的图标（框架自带的 `app.css` 示例就是这样做的），然后在菜单管理中填入 `icon-rocket`：

```css
.icon-rocket:before {
    content: "🚀";
}
```

**隐藏不需要的顶栏按钮**：

```css
/* 隐藏顶栏的全屏按钮 */
:root .alain-default__header [data-action="fullscreen"] {
    display: none;
}
```

**调整表格密度**：

```css
:root .erupt-table .ant-table-tbody > tr > td {
    padding-top: 6px;
    padding-bottom: 6px;
}
```

:::tip 查找选择器
浏览器开发者工具里定位到目标元素，复制其 class 后加 `:root` 前缀即可。框架升级后组件 class 可能变化，升级后请复查自定义样式是否仍然生效。
:::
