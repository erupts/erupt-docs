# 参数配置

## 后端配置（application.yml）

> 配置项均可选，按需配置即可

```yaml
erupt-app:
  # 是否开启水印，1.12.0 及以上版本支持
  water-mark: true
  # 登录失败几次出现验证码，值为0时表示一直需要登录验证码
  verify-code-count: 2
  # 登录密码是否加密传输，特殊场景如：LDAP登录可关闭该功能获取密码明文
  pwd-transfer-encrypt: true
  # 是否开启密码重置功能，关闭后前端会屏蔽所有重置密码的入口，1.12.7 及以上版本支持
  reset-pwd: true
  # 多语言配置，系统默认语言使用 erupt.default-locales 控制
  locales:
    - "zh-CN"   # 简体中文
    - "zh-TW"   # 繁体中文
    - "en-US"   # English
    - "fr-FR"   # En français
    - "ja-JP"   # 日本語
    - "ko-KR"   # 한국어
    - "ru-RU"   # русск
    - "es-ES"   # español
    - "de-DE"   # Deutsch
    - "pt-PT"   # Português
    - "id-ID"   # Bahasa Indonesia
    - "ar-SA"   # العربية
  # 自定义登录页路径，1.10.6 及以上版本支持，支持http网络路径
  login-page-path: /customer-login.html
erupt:
  # 是否开启csrf防御
  csrf-inspect: true
  # 开启redis方式存储session，默认false，开启后需在配置文件中添加redis配置（同 Spring Boot）
  redis-session: false
  # redis session是否自动续期，1.10.8及以上版本支持
  redis-session-refresh: false
  # 附件上传存储路径, 默认路径为：/opt/erupt-attachment
  upload-path: D:/erupt/pictures
  # 是否保留上传文件原始名称
  keep-upload-file-name: false
  # 项目初始化方式，NONE 不执行初始化代码、EVERY 每次启动都进行初始化、FILE 通过标识文件判断是否需要初始化
  init-method-enum: file
  # 默认语言，控制初始化场景中各类文本的数据，1.12.3 及以上版本支持
  default-locales: zh-CN
  # 是否开启任务调度（导入erupt-job时有效）
  job.enable: true
  # 是否开启日志采集，开启后可在系统日志中查看实时日志，1.12.14 及以上版本支持
  log-track: true
  # 日志采集最大暂存行数，1.12.14 及以上版本支持
  log-track-cache-size: 1000
  # 是否记录操作日志，默认true，该功能开启后可在【系统管理 → 操作日志】中查看操作日志
  security:
    record-operate-log: true
  upms:
    # 登录 session 时长
    expire-time-by-login: 60
    # 严格的角色菜单策略
    strict-role-menu-legal: true
    # 系统初始化时默认超管用户名，1.12.18及以上版本支持
    default-account: erupt
    # 系统初始化时默认超管密码，1.12.18及以上版本支持
    default-password: erupt

# redis配置，当 erupt.redis-session 为 true 时必须配置此项
spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

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
    background-image: url(https://www.erupt.xyz/demo/login-bg.svg) !important;
}
```

## 自定义首页（home.html）

文件需手动创建，位置：`/resources/public/home.html`

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
