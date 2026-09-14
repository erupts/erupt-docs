# 参数配置

Erupt 的配置分两处：**后端**写在 `application.yml`，**前端**写在 `resources/public/` 下的静态文件（`app.js`、`app.css`、`home.html`）。所有配置项均可选，按需配置即可。

## 后端配置（application.yml）

### erupt-app 前端应用配置

`erupt-app.*` 控制**前端表现**（水印、验证码策略、多语言、登录页等），由 `xyz.erupt.upms.prop.EruptAppProp` 承载，随 `erupt-upms` 一起引入。前端启动时通过 `GET /erupt-api/erupt-app` 一次性拉取这份配置。

```yaml
erupt-app:
  # 是否开启页面水印，v1.12.0+
  water-mark: true
  # 水印是否附带日期，v1.14.3+
  water-mark-date: false
  # 自定义水印内容，为空时显示当前登录用户，v1.14.3+
  water-mark-content: ""
  # 登录失败几次后出现验证码；0 表示每次登录都需要验证码
  verify-code-count: 2
  # 登录密码是否加密传输；LDAP 等需要明文密码的场景可关闭
  pwd-transfer-encrypt: true
  # 是否开启密码重置功能，关闭后前端屏蔽所有重置入口，v1.12.7+
  reset-pwd: true
  # 登录后是否提示仍在使用默认密码的用户去修改密码
  reset-pwd-prompt: false
  # 自定义登录页路径，支持 HTTP 网络路径，v1.10.6+
  login-page-path: /customer-login.html
  # 登录页与右上角语言切换器中可选的语言；系统默认语言由 erupt.default-locales 控制
  # 配成空列表时自动回落为 ["en-US"]
  locales:
    - "zh-CN"   # 简体中文
    - "zh-TW"   # 繁体中文
    - "en-US"   # English
    - "fr-FR"   # Français
    - "ja-JP"   # 日本語
    - "ko-KR"   # 한국어
    - "ru-RU"   # русск
    - "es-ES"   # español
    - "de-DE"   # Deutsch
    - "pt-PT"   # Português
    - "id-ID"   # Bahasa Indonesia
    - "ar-SA"   # العربية
  # 自定义键值，随 /erupt-api/erupt-app 一起下发到前端，可在 app.js 或 TPL 页面中读取
  properties:
    show-help-entry: true
    help-doc-url: https://docs.your-company.com
```

:::warning `verify-code-count: 0` 不是关闭验证码
`0` 表示**每次登录都要求验证码**。若要放宽，请把值调大。
:::

:::tip `reset-pwd` 与 `reset-pwd-prompt` 的区别
`reset-pwd` 决定**功能是否存在**（关掉后连入口都没有）；`reset-pwd-prompt` 决定**要不要催**——开启后，仍在用初始密码的用户每次登录都会收到修改提示。生产环境建议 `reset-pwd-prompt: true`。
:::

`properties` 也可以在代码中动态注册。`erupt-websocket`、`erupt-ai`、`erupt-notice`、`erupt-print` 等模块正是用这个机制向前端声明"我装上了"，前端据此决定是否渲染对应入口：

```java
@Resource
private EruptAppProp eruptAppProp;

@PostConstruct
public void init() {
    eruptAppProp.registerProp("my-module", true);
}
```

接口响应中另有 `hash`（控制器实例 hashCode，前端用于判断配置是否变化）与 `version`（当前 Erupt 版本号）两个只读字段，由服务端填充，写进 yaml 无效。

相关：[自定义登录页](/zh/advanced/custom-login-page) · [国际化 i18n](/zh/advanced/i18n)

### erupt 框架核心

```yaml
erupt:
  # 是否开启 csrf 防御
  csrf-inspect: true
  # 附件上传存储路径，默认 /opt/erupt-attachment
  upload-path: D:/erupt/pictures
  # 是否保留上传文件原始名称
  keep-upload-file-name: false
  # 项目初始化方式：NONE 不执行初始化代码、EVERY 每次启动都初始化、FILE 通过标识文件判断是否需要初始化
  init-method-enum: file
  # 默认语言，控制初始化场景中各类文本的数据，v1.12.3+
  default-locales: zh-CN
  # 是否开启日志采集，开启后可在【系统日志】中查看实时日志，v1.12.14+
  log-track: true
  # 日志采集最大暂存行数，v1.12.14+
  log-track-cache-size: 1000
  security:
    # 是否记录操作日志，开启后可在【系统管理 → 操作日志】中查看
    record-operate-log: true
    # 操作日志记录的最大请求体字节数，超出或分块传输的请求体不做缓存记录，默认 1MB，v2.0.2+
    record-operate-log-max-body-size: 1048576
  upms:
    # 登录 session 时长（分钟）
    expire-time-by-login: 60
    # 严格的角色菜单策略，默认 true。控制的是【角色管理 → 菜单权限】的候选菜单树：
    # 开启后非超管用户只能分配自己已拥有的菜单（取其全部启用状态角色的菜单并集），无法给角色授予自己没有的权限；
    # 超管不受限制；关闭后任何能进入角色管理的用户都可分配全部菜单，等同放开提权能力。
    # 注意：角色上原有的、超出操作人可见范围的菜单不会显示在树中，该用户保存角色后会被移除，此类角色请由超管维护
    strict-role-menu-legal: true
    # 系统初始化时默认超管用户名，v1.12.18+
    default-account: erupt
    # 系统初始化时默认超管密码，v1.12.18+
    default-password: erupt
```

### erupt.redis-session 分布式会话

开启后 session 存入 Redis，需同时添加 Spring Boot 标准的 Redis 配置：

```yaml
erupt:
  # 开启 redis 方式存储 session，默认 false
  redis-session: true
  # redis session 是否自动续期，v1.10.8+
  redis-session-refresh: false

spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

### erupt.telemetry 匿名遥测

```yaml
erupt:
  telemetry:
    # 是否上报匿名使用统计，默认 true，v2.2.0+
    # 也可用环境变量 ERUPT_TELEMETRY_DISABLED=1 关闭，CI 环境自动跳过
    enabled: true
    # 上报地址，可指向自建 collector
    endpoint: https://telemetry.erupt.xyz/v1/ping
```

收集字段清单见[匿名遥测](/zh/guide/telemetry)。

### 模块自有配置

各扩展模块的配置项（如 `erupt.ai.*`、`erupt.designer.*`、`erupt.remote.*`、`erupt.job.*`）只在引入对应模块后生效，统一放在各模块文档中说明，不在此处重复：[Erupt AI](/zh/modules/erupt-ai/) · [Erupt AI Claw](/zh/modules/erupt-ai-claw/) · [Erupt Designer](/zh/modules/erupt-designer) · [Erupt Remote](/zh/modules/erupt-remote) · [Erupt Job](/zh/modules/erupt-job)。

## 前端配置（app.js）

文件需手动创建，位置：`/resources/public/app.js`

功能包括：基础参数配置，路由回调函数，全局生命周期函数等

```javascript
window.eruptSiteConfig = {
    // erupt接口地址，在前后端分离时指定
    domain: "",
    // 附件地址，一般情况下不需要指定，如果自定义对象存储空间，则需在此指定附件资源访问地址
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
    // logo路径
    logoPath: "erupt.svg",
    // 菜单折叠后的logo路径，1.12.21及以上版本支持
    logoFoldPath: null,
    // logo文字
    logoText: "erupt",
    // 注册页地址
    registerPage: "",
    // 外观默认值。每一项都只在用户没有在「页面配置」抽屉里做过选择时生效，
    // 用户选过后以浏览器中记住的选择为准
    theme: {
        // 主题色，2.2.0 起默认值为 rgb(22, 119, 255)
        primaryColor: "rgb(22, 119, 255)",
        // 顶栏颜色："primary" 跟随主题色，或任意 CSS 颜色
        headerColor: "primary",
        // 明暗模式：false | true | "auto"（跟随系统）
        dark: false,
        // 紧凑模式
        compact: false,
        // 主题风格："default" | "brutalist" | "liquid-glass"
        skin: "default",
        // 菜单模式："normal" 侧栏 | "split" 一级分类放到顶栏 | "dual" 双栏侧栏 | "top" 全部菜单放到顶栏，无侧栏
        menuMode: "normal"
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

## 前端样式（app.css）

文件需手动创建，位置：`/resources/public/app.css`

可通过 app.css 覆盖页面原有样式，或定义新的样式。

```css
/* 例：修改登录页样式 */
layout-passport > .container {
    background-position: center !important;
    background-repeat: repeat !important;
    background-size: cover !important;
    background-color: #fff !important;
    background-image: url(https://www.erupt.xyz/login-bg.svg) !important;
}
```

## 自定义首页（home.html）

Erupt 自带默认首页，无需配置即可使用。如需替换为自己的首页，在 `/resources/public/home.html` 创建文件即可，框架会优先加载它：

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta content="width=device-width, initial-scale=1" name="viewport">
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```
