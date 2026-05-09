---
layout: home

hero:
  name: Erupt Engine
  text: 注解驱动的低代码平台
  tagline: 一个 Java 类文件，生成完整后台管理系统。零前端代码，零 CRUD，内置 AI 大模型深度集成。
  image:
    light: /logo.svg
    dark: /logo2.svg
    alt: Erupt
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/quick-start
    - theme: alt
      text: 在线体验
      link: https://www.erupt.xyz/demo
    - theme: alt
      text: Linq.J
      link: https://linq.erupt.xyz/
    - theme: alt
      text: 🚀 项目初始化
      link: https://start.erupt.xyz/

features:
  - icon: ✍️
    title: 一个注解，完整 CRUD
    details: 在类上加 @Erupt，在字段上加 @EruptField，框架自动生成增删改查界面、搜索、分页、权限——无需任何 Controller / Service / Mapper。
  - icon: 🖥️
    title: 零前端代码
    details: 框架根据注解配置自动渲染前端页面，彻底告别前后端联调。20+ 内置组件类型覆盖绝大多数业务场景。
  - icon: 🤖
    title: AI 大模型深度集成
    details: erupt-ai 支持 ChatGPT、Claude、DeepSeek 等 15+ 主流模型，内置 MCP Server、Agent、Tool 调用，低代码构建 AI 应用。
  - icon: 🔒
    title: 权限管理开箱即用
    details: 完整的用户、角色、菜单、组织权限体系，行级数据权限，登录日志，操作审计，JWT / Session 双模式认证。
  - icon: 🧩
    title: 模块化生态
    details: 定时任务、消息通知、服务监控、WebSocket、代码生成、MongoDB、Magic API 在线 IDE……按需引入，互不干扰。
  - icon: ☁️
    title: 分布式云原生
    details: erupt-cloud 支持微服务架构，零前端代码管理集群内任意服务配置，对 K8s 友好，支持 IP 漂移与 svc 映射。
---

<div class="home-content">

## 三行代码，一张完整的管理表格

```java
@Erupt(name = "用户管理")
@Table(name = "sys_user") @Entity
public class SysUser extends BaseModel {

    @EruptField(
        views = @View(title = "用户名"),
        edit  = @Edit(title = "用户名", notNull = true)
    )
    private String username;

    @EruptField(
        views = @View(title = "邮箱"),
        edit  = @Edit(title = "邮箱", type = EditType.INPUT)
    )
    private String email;

    @EruptField(
        views = @View(title = "状态"),
        edit  = @Edit(title = "状态", type = EditType.BOOLEAN)
    )
    private Boolean enable;
}
```

以上代码自动生成：**列表展示 · 新增 · 编辑 · 删除 · 搜索 · 分页 · 权限控制**，无需任何额外代码。

---

## 模块生态

<div class="module-grid">

**核心模块**

| 模块 | 说明 |
| --- | --- |
| [erupt-upms](/modules/erupt-upms) | 用户权限管理：用户、角色、菜单、组织、字典 |
| [erupt-job](/modules/erupt-job) | 可视化定时任务管理，支持 Cron 表达式与任务日志 |
| [erupt-monitor](/modules/erupt-monitor) | 服务监控：CPU / JVM / Redis / 在线用户 |
| [erupt-notice](/modules/erupt-notice) | 站内通知、全员公告、可插拔多渠道推送 |
| [erupt-tpl](/modules/erupt-tpl) | 自定义页面，支持 Freemarker / Amis / 微前端 |
| [erupt-magic-api](/modules/erupt-magic-api) | 在线 IDE，浏览器编写接口代码实时生效 |
| [erupt-cloud](/modules/erupt-cloud) | 分布式微服务配置管理，替代 Apollo / Nacos |

**AI 模块**

| 模块 | 说明 |
| --- | --- |
| [🐴 Erupt AI Harness](/modules/erupt-ai) | 深度集成 LLM，内置 Chat / Agent / MCP Server |
| [🦞 Erupt AI Claw](/modules/erupt-ai-claw) | 自然语言驱动服务器，操作数据、执行 Shell、扩展 Skill |

**商业模块**

| 模块 | 说明 |
| --- | --- |
| [Erupt Flow](/modules/pro/erupt-flow) | 可视化流程引擎，钉钉风格审批配置 |
| [Erupt Tenant](/modules/pro/erupt-tenant) | SaaS 多租户，表级数据隔离 |
| [Erupt Cube](/modules/pro/erupt-cube) | 语义层 BI 平台，对标 Google Looker |
| [Erupt Chart](/modules/pro/erupt-chart) | 纯 SQL 低代码报表图表 |

</div>

---

## 技术栈

| 维度 | 说明 |
| --- | --- |
| JDK | 17+ |
| Spring Boot | 3.x |
| 数据库 | MySQL · PostgreSQL · Oracle · SQL Server · H2 · MongoDB |
| 启动速度 | 2s ~ 5s |
| 终端适配 | PC · 平板 · 手机 |
| 开源协议 | Apache 2.0 |

</div>

<style>
.home-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 48px 24px;
}
.home-content h2 {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 48px 0 20px;
}
.home-content hr {
  margin: 48px 0;
  border: none;
  border-top: 1px solid var(--vp-c-divider);
}
</style>
