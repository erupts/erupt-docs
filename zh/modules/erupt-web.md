# Erupt Web 前端源码

erupt-web 是 Erupt 框架的前端模块，基于 Angular 开发，提供完整的后台管理界面。以 Jar 形式分发，无需单独部署前端服务。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

在前后端分离部署场景下，可不添加此依赖，将前端单独部署，详见[前后端分离部署](/zh/advanced/separation)。

## 前端源码

前端仓库：[https://github.com/erupts/erupt-web](https://github.com/erupts/erupt-web)

## 主题与皮肤 <Badge type="tip" text="v2.2.0+" />

右上角设置抽屉中可实时切换外观，选择保存在浏览器 localStorage 中：**皮肤**（默认 / Brutalist / Liquid Glass 液态玻璃 / Workspace / Classic，2.3.0 起选择器为带缩略图的平铺网格）、**配色方案**（浅色 / 深色 / 跟随系统）、**紧凑模式**、**主题色与顶栏色**（预设 + 自定义取色器）、**菜单模式**（单列 / 分组 / 双列 / 分栏 / 顶部 / 顶栏双行）与折叠时显示文字。登录页同样提供皮肤下拉与主题色取色器——这是用户见到的第一个界面，在登录前就能调整。若站点不希望用户改动品牌外观，可在 `app.js` 中设置 `theme.customizable: false` <Badge type="tip" text="v2.3.0+" />，只把浅色 / 深色与紧凑模式留给个人。

其中 **Liquid Glass** 是一套半透明材质皮肤：侧边栏为带背景模糊与高光边缘的玻璃面板，悬浮在环境色场之上，内容区以同样的间距内缩，让色场透出并与之融合；内容区内部的组件不受影响。

**Workspace** <Badge type="tip" text="v2.3.0+" /> 是 Slack / 飞书 / 钉钉式的工作台外壳：顶栏与侧边栏共用一块品牌色调的框架，内容区以圆角卡片浮在其上，框架配色有 32 套浅色 / 深色预设（`theme.workspaceFrame`）。**Classic** <Badge type="tip" text="v2.3.0+" /> 则是 Ant Design Pro 的经典深蓝侧栏 + 白色顶栏。

完整配置项与其余界面能力见 [界面与交互](/zh/guide/ui)。

:::tip 默认主题色
2.2.0 起默认主题色调整为 `rgb(22, 119, 255)`，可通过 `app.js` 的 `theme.primaryColor` 覆盖。
:::

### 登录页布局 <Badge type="tip" text="v2.3.0+" />

登录页有居中卡片、侧边面板、宽卡分栏、壁纸玻璃、品牌满屏五种布局，可在登录页导航中切换，站点默认值为 `theme.loginLayout`；`theme.loginBackground` 可换上自己的背景图。详见 [界面与交互 → 登录页布局](/zh/guide/ui#登录页布局)。

### 表单面板 <Badge type="tip" text="v2.3.0+" />

记录表单统一为可在中间弹窗 / 侧边面板 / 全屏三种形态间切换的表单面板（`theme.formPanelMode`），标题栏提供上一条 / 下一条、查看 ↔ 编辑、复制链接、删除、AI、打印与评论等操作，并支持 `?id=` 深链接。详见 [界面与交互 → 表单面板](/zh/guide/ui#表单面板)。

### 安装为桌面应用（PWA） <Badge type="tip" text="v2.3.0+" />

Erupt 可作为 PWA 安装到桌面：清单由站点配置自动生成，`pwa.icon` / `pwa.shortcuts` 补充图标与快捷入口，顶栏兼作窗口标题栏，`faviconPath` 自定义标签图标。详见 [界面与交互 → 安装为桌面应用（PWA）](/zh/guide/pwa)。

## 图标库 <Badge type="tip" text="v2.2.0+" />

图标库从停更于 2016 年的 `font-awesome` 4.7 迁移到 `@fortawesome/fontawesome-free` 7.x，可用图标由 675 个增加到 1992 个——菜单图标、`@Drill` 与 `@RowOperation` 的图标名都由用户自己填写，因此这是一个用户可感知的变化。

FA4 的旧类名通过 `v4-shims` 继续可用（`-o` 结尾的空心图标回落到常规字重）。唯一的视觉差异：FA7 给每个 `.fa` 设置了 `1.25em` 的默认宽度，使图标落在统一的方框内；需要旧行为可设置 `--fa-width: auto`。

## 自定义外观

通过修改 `resources/public/app.js` 和 `resources/public/app.css` 可自定义前端外观，详见[前端配置（app.js）](/zh/guide/config-frontend)与[前端样式（app.css）](/zh/guide/config-style)。
