# 前端配置（app.js）

:::info 参数配置分为四篇
Erupt 的配置分两处：**后端**写在 `application.yml`，**前端**写在 `resources/public/` 下的静态文件。所有配置项均可选，按需配置即可。

- [后端配置（application.yml）](/zh/guide/configuration)：`erupt-app`、`erupt`、`erupt.upms`、`erupt.redis-session`、`erupt.telemetry`
- [前端配置（app.js）](/zh/guide/config-frontend)：站点信息、Logo、外观默认值、PWA、路由与生命周期回调
- [前端样式（app.css）](/zh/guide/config-style)：覆盖或补充界面样式
- [自定义首页（home.html）](/zh/guide/config-home)：替换登录后的欢迎页
:::

文件需手动创建，位置：`/resources/public/app.js`

功能包括：基础参数配置，路由回调函数，全局生命周期函数等

```javascript
window.eruptSiteConfig = {
    // erupt接口地址，在前后端分离时指定
    domain: "",
    // 附件地址。2.3.0 起留空时自动取后端注册的 AttachmentProxy（如 erupt-data-s3）下发的地址，只在需要显式覆盖时填写
    fileDomain: "",
    // 标题
    title: "Erupt",
    // 描述
    desc: "通用数据管理框架",
    // 是否展示版权信息
    copyright: true,
    // 是否默认开启多标签页路由复用，v2.2.0+（用户在设置抽屉中的选择优先）
    tabReuse: false,
    // 自定义版权内容，1.12.8及以上版本支持
    copyrightTxt: function() {
      return "版权信息xxxx"
    },
    // 高德地图 api key，使用地图组件须指定此属性
    amapKey: "xxxx",
    // 高德地图 SecurityJsCode
    amapSecurityJsCode: "xxxxx",
    // Logo：不写该键则使用默认（内置 erupt 标志），设为 null 或 '' 则该位置不显示任何 logo，v2.3.0+ 起三个键规则一致
    // logoPath: "erupt.svg",      // 展开状态顶栏 logo（默认：内置 erupt 标志）
    // logoFoldPath: null,         // 菜单折叠后的 logo，1.12.21+（默认：跟随 logoPath；未配置 logo 时显示站点名首字母方块）
    // loginLogoPath: null,        // 登录页 logo（默认：跟随 logoPath）
    // logo文字
    logoText: "erupt",
    // 注册页地址
    registerPage: "",
    // 浏览器标签图标，支持 ico / png / svg，默认 favicon.ico，v2.3.0+
    // faviconPath: "https://docs.erupt.xyz/icon.svg",
    // 安装为桌面应用（PWA），v2.3.0+。应用名、描述与颜色取自 logoText / title / desc 与顶栏，这里只补充图标与图标右键菜单
    pwa: {
        // icon: "assets/pwa-icon.svg",             // svg，或 512px 以上的 png / jpg / webp
        // shortcuts: [{name: "首页", url: "./#/"}], // 支持 hash 路由；可带 icon / description
    },
    // 外观默认值。每一项都只在用户没有在「页面配置」抽屉里做过选择时生效，
    // 用户选过后以浏览器中记住的选择为准
    theme: {
        // 是否允许用户自行修改品牌外观（主题色、顶栏色、皮肤、导航配色、菜单模式），v2.3.0+
        // false 时隐藏这些控件、清除用户已保存的选择并强制使用此处配置；浅色 / 深色与紧凑模式不受影响
        customizable: true,
        // 主题色，2.2.0 起默认值为 rgb(22, 119, 255)
        primaryColor: "rgb(22, 119, 255)",
        // 顶栏颜色："primary" 跟随主题色，或任意 CSS 颜色
        headerColor: "primary",
        // 明暗模式：false | true | "auto"（跟随系统）
        dark: false,
        // 紧凑模式
        compact: false,
        // 主题风格："default" | "brutalist" | "liquid-glass"
        //   | "workspace"（工作台外壳：品牌色框架 + 圆角内容卡片，v2.3.0+）| "classic"（Ant Design Pro：深蓝侧栏 + 白色顶栏，v2.3.0+）
        skin: "default",
        // 仅 workspace 皮肤：导航框架配色预设，不设则从主题色推导，v2.3.0+
        //   浅色："mist" | "sky" | "azure" | "salt" | "gray" | "mint" | "mint-chip" | "lime" | "citrus" | "banana" | "brass" | "almond" | "peach"
        //        | "dawn" | "blush" | "raspberry" | "mauve" | "lilac" | "lavender-mint"
        //   深色："deep-sea" | "lagoon" | "indigo" | "slate" | "starry" | "teal" | "jade" | "pine" | "clementine" | "wine" | "aubergine" | "plum" | "graphite"
        // workspaceFrame: "sky",
        // 菜单模式："normal" 侧栏 | "group" 一级分类作为分组标题（v2.3.0+）| "dual" 双栏侧栏 | "split" 一级分类放到顶栏
        //   | "top" 全部菜单放到顶栏，无侧栏 | "top-split" 一级分类在顶栏、子菜单在第二行，无侧栏（v2.3.0+）
        menuMode: "normal",
        // 记录表单的打开形态："center" 中间弹窗 | "side" 侧边面板 | "full" 全屏，v2.3.0+
        // formPanelMode: "center",
        // 登录页布局："center" 居中卡片 | "cover" 侧边面板 | "wide" 宽卡分栏 | "wallpaper" 壁纸玻璃 | "poster" 品牌满屏，v2.3.0+
        // loginLayout: "center",
        // 登录页背景图，替换所有布局中的默认插画（wallpaper 布局在其上加毛玻璃卡片），v2.3.0+
        // loginBackground: "https://example.com/login-bg.jpg",
    },
    // 触碰用户头像后的菜单，1.12.21及以上版本支持
    userTools: [{
        text: "自定义用户工具栏",
        icon: "fa fa-snowflake-o",
        click: function (event) {
            alert("On Click")
        }
    }],
    // 自定义导航栏按钮，配置后将会出现在页面右上角
    r_tools: [{
        icon: "fa-eercast",
        render: () => {
          return `<h2>自定义渲染</h2>`
        },
        mobileHidden: false,
        click: function (event) {
            alert("Function button");
        }
    }],
};

// 路由回调函数
window.eruptRouterEvent = {
    demo: {
        load: function (e) { },
        unload: function (e) { }
    },
    $: {
        load: function (e) { },
        unload: function (e) { }
    }
};

// erupt生命周期函数
window.eruptEvent = {
    startup: function () { },
    login: function(user){
      window.notify.success("Tip", "login success")
    },
    logout: function(user){ }
}
```

最小配置推荐：

```javascript
window.eruptSiteConfig = {
  title: "Your App Title",
  desc: "description",
  copyright: false,
  logoPath: "erupt.svg",
  logoText: "APP",
};
```
