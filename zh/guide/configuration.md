# 后端配置（application.yml）

:::info 参数配置分为四篇
Erupt 的配置分两处：**后端**写在 `application.yml`，**前端**写在 `resources/public/` 下的静态文件。所有配置项均可选，按需配置即可。

- [后端配置（application.yml）](/zh/guide/configuration)：`erupt-app`、`erupt`、`erupt.upms`、`erupt.redis-session`、`erupt.telemetry`
- [前端配置（app.js）](/zh/guide/config-frontend)：站点信息、Logo、外观默认值、PWA、路由与生命周期回调
- [前端样式（app.css）](/zh/guide/config-style)：覆盖或补充界面样式
- [自定义首页（home.html）](/zh/guide/config-home)：替换登录后的欢迎页
:::

## erupt-app 前端应用配置

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

相关：[自定义登录页](/zh/advanced/auth#自定义登录页) · [国际化 i18n](/zh/advanced/i18n)

## erupt 框架核心

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
    # 登录锁定：同一账号 + IP 连续密码错误达到 max-failures 次后锁定 lock-minutes 分钟，错误验证码同样计数，v2.3.0+
    login-lock:
      enable: true
      max-failures: 10
      lock-minutes: 10
```

## erupt.redis-session 分布式会话

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

## erupt.telemetry 匿名遥测

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

## 模块自有配置

各扩展模块的配置项（如 `erupt.ai.*`、`erupt.designer.*`、`erupt.remote.*`、`erupt.job.*`、`erupt.s3.*`、`erupt.dingtalk.*`、`erupt.airtable.*`）只在引入对应模块后生效，统一放在各模块文档中说明，不在此处重复：[Erupt AI](/zh/modules/erupt-ai/) · [Erupt AI Claw](/zh/modules/erupt-ai-claw/) · [Erupt Designer](/zh/modules/erupt-designer) · [Erupt Remote](/zh/modules/erupt-remote) · [Erupt Job](/zh/modules/erupt-job) · [erupt-data-s3](/zh/modules/erupt-s3/config) · [erupt-data-dingtalk](/zh/modules/erupt-dingtalk) · [erupt-data-airtable](/zh/modules/erupt-airtable)。
