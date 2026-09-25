# 安装为桌面应用（PWA） <Badge type="tip" text="v2.3.0+" />

Erupt 可作为渐进式 Web 应用（Progressive Web App）安装到桌面：拥有独立窗口、任务栏 / Dock 图标与右键快捷入口，看起来和用起来都像一个原生客户端，而部署上仍只是那一个 Web 站点。

## 安装方式

![安装为桌面应用后的 Erupt（Brutalist 皮肤，顶栏兼作窗口标题栏）](/ui/pwa.png)

用 Chrome 或 Edge 打开站点，点击地址栏右侧的「安装」按钮（或浏览器菜单 → 安装应用）。安装后应用在独立窗口中打开，登录态与浏览器共享。

:::tip 前置条件
浏览器只对 **HTTPS** 站点（以及 `localhost`）提供安装入口，生产环境请通过 HTTPS 访问。Safari 与 Firefox 桌面版目前不支持 window-controls-overlay，安装后以普通独立窗口运行，顶栏不会兼作标题栏。
:::

## 配置

所有配置都在 `app.js` 的 `eruptSiteConfig` 中，不需要维护 manifest 文件：

```javascript
window.eruptSiteConfig = {
    title: "Erupt Engine",          // 应用名
    desc: "Low-Code & AI Harness",  // 应用描述
    logoText: "Erupt",              // 短名称（任务栏 / Dock 下方显示）
    faviconPath: "icon.svg",        // 浏览器标签图标，ico / png / svg 均可
    pwa: {
        icon: "assets/pwa-icon.svg",             // 应用图标：svg，或 512px 以上的 png / jpg / webp
        shortcuts: [                             // 图标右键菜单中的快捷入口
            {name: "首页", url: "./#/"},
            {name: "用户管理", url: "./#/build/table/EruptUser", description: "维护登录账号"}
        ]
    },
    theme: {
        headerColor: "primary"      // 顶栏颜色同时决定窗口按钮四周的颜色
    }
};
```

| 配置项 | 说明 |
| --- | --- |
| `title` / `desc` / `logoText` | 分别作为应用的名称、描述与短名称写入清单 |
| `pwa.icon` | 应用图标。svg 可任意缩放；位图会被测量实际尺寸后写入清单，建议不小于 512px，正方形 |
| `pwa.shortcuts` | 右键应用图标（Windows 任务栏、macOS Dock）时的快捷入口，每项含 `name`、`url`，可选 `description` 与 `icon`；`url` 支持 hash 路由 |
| `faviconPath` | 浏览器标签图标，预加载阶段即生效，不会先闪一下默认图标；运行时可调用 `window.eruptApplyFavicon(url)` 更换（例如租户按域名换图标） |
| `theme.headerColor` | 顶栏颜色，安装后同时作为窗口按钮周围的底色 |

清单在运行时按上述配置生成并以 `blob:` 地址注入，因此改动 `app.js` 后刷新页面即可生效；已安装的应用会在下次启动时由浏览器自动更新名称与图标。

## 顶栏即标题栏

清单声明了 `display_override: ["window-controls-overlay"]`。在支持的浏览器中，安装后的窗口没有独立的系统标题栏，Erupt 的顶栏直接顶到窗口最上沿：

- 顶栏空白区域可拖动窗口，菜单、搜索、通知等按钮照常可点
- 顶栏自动为系统窗口按钮（关闭 / 最小化 / 最大化）留出位置，品牌区块隐藏
- 抽屉、侧边表单面板、通知弹层都从顶栏下方开始，不会盖住窗口按钮
- 可拖拽的弹窗会被限制在窗口按钮以下，不会被拖到不可点击的区域

## 窗口颜色跟随页面

浏览器围绕窗口按钮绘制的那一块颜色取自 `<meta name="theme-color">`，Erupt 会持续同步它：

- 颜色从**实际绘制**的顶栏读取，透明或半透明顶栏（Liquid Glass、Workspace 框架）会先与其下层背景合成
- 登录页没有顶栏时读取页面底色，自定义登录图片同样适用
- 弹窗 / 抽屉遮罩、锁屏出现时同步变暗，遮罩消失即恢复，窗口四角始终与页面一致

## 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 地址栏没有「安装」按钮 | 站点不是 HTTPS，或浏览器不支持 PWA 安装；先确认能通过 HTTPS 访问 |
| 安装后图标是默认的 Erupt 标识 | 未配置 `pwa.icon`；配置后卸载再安装，或等浏览器下次启动时更新 |
| 快捷入口没有出现 | Windows 需右键任务栏图标，macOS 需右键 Dock 图标；部分系统仅在应用运行时显示 |
| 顶栏没有变成标题栏 | 浏览器不支持 window-controls-overlay（Safari、Firefox），或用户在窗口菜单中关闭了该模式 |

相关配置项见 [前端配置](/zh/guide/config-frontend)，界面其余能力见 [界面与交互](/zh/guide/ui)。
