---
layout: home

hero:
  name: Erupt Engine
  text: Annotation-driven Low-Code Platform
  tagline: One Java class generates a complete admin system — zero frontend code, zero CRUD, with built-in deep integration of AI LLMs.
  image:
    light: /logo.svg
    dark: /logo2.svg
    alt: Erupt
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide/quick-start
    - theme: alt
      text: Online Demo
      link: https://demo.erupt.xyz
    - theme: alt
      text: 🚀 Quick Init
      link: https://start.erupt.xyz

features:
  - icon: ✍️
    title: One Annotation, Full CRUD
    details: Add @Erupt on the class and @EruptField on fields, and the framework auto-generates list / create / edit / delete UI, search, pagination, and permission — no Controller / Service / Mapper required.
  - icon: 🖥️
    title: Zero Frontend Code
    details: The framework renders the UI automatically from your annotations. Say goodbye to frontend-backend coordination. 20+ built-in component types cover almost every business scenario.
  - icon: 🤖
    title: Deep AI Integration
    details: erupt-ai supports 15+ mainstream LLMs (ChatGPT, Claude, DeepSeek, …), with built-in MCP Server, Agent, and Tool calling — build AI applications with low code.
  - icon: 🔒
    title: Out-of-the-Box Auth
    details: Complete users / roles / menus / org permission system, row-level data permissions, login audit, operation audit, and JWT / Session dual authentication.
  - icon: 🧩
    title: Modular Ecosystem
    details: Scheduled jobs, notifications, service monitoring, WebSocket, code generation, MongoDB, Magic API online IDE … plug in only what you need without interference.
  - icon: ☁️
    title: Cloud-Native & Distributed
    details: erupt-cloud supports microservice architecture and manages cluster service configuration with zero frontend code. Kubernetes-friendly, with IP drift and svc mapping.
---

<div class="home-content">

## Three lines of code, a full admin table

```java
@Erupt(name = "User Management")
@Table(name = "sys_user") @Entity
public class SysUser extends BaseModel {

    @EruptField(
        views = @View(title = "Username"),
        edit  = @Edit(title = "Username", notNull = true)
    )
    private String username;

    @EruptField(
        views = @View(title = "Email"),
        edit  = @Edit(title = "Email", type = EditType.INPUT)
    )
    private String email;

    @EruptField(
        views = @View(title = "Enabled"),
        edit  = @Edit(title = "Enabled", type = EditType.BOOLEAN)
    )
    private Boolean enable;
}
```

The code above automatically generates: **list view · create · edit · delete · search · pagination · permission control** — no extra code required.

---

## Module Ecosystem

<div class="module-grid">

**Core Modules**

| Module | Description |
| --- | --- |
| [erupt-upms](/en/modules/erupt-upms) | User & permission management: users, roles, menus, orgs, dictionaries |
| [erupt-job](/en/modules/erupt-job) | Visual scheduled jobs with Cron expressions and execution logs |
| [erupt-monitor](/en/modules/erupt-monitor) | Service monitoring: CPU / JVM / Redis / online users |
| [erupt-notice](/en/modules/erupt-notice) | In-app notifications, global announcements, pluggable multi-channel push |
| [erupt-tpl](/en/modules/erupt-tpl) | Custom pages with Freemarker / Amis / micro-frontend |
| [erupt-magic-api](/en/modules/erupt-magic-api) | Online IDE — write API code in the browser with hot reload |
| [erupt-cloud](/en/modules/erupt-cloud) | Distributed microservice config center — an alternative to Apollo / Nacos |

**AI Modules**

| Module | Description |
| --- | --- |
| [🐴 Erupt AI Harness](/en/modules/erupt-ai) | Deep LLM integration with built-in Chat / Agent / MCP Server |
| [🦞 Erupt AI Claw](/en/modules/erupt-ai-claw) | Natural-language driven server: operate data, run shell, extend skills |

**Commercial Modules**

| Module | Description |
| --- | --- |
| [Erupt Flow](/en/modules/pro/erupt-flow) | Visual workflow engine with DingTalk-style approval configuration |
| [Erupt Tenant](/en/modules/pro/erupt-tenant) | SaaS multi-tenancy with table-level data isolation |
| [Erupt Cube](/en/modules/pro/erupt-cube) | Semantic-layer BI platform, on par with Google Looker |
| [Erupt Chart](/en/modules/pro/erupt-chart) | Pure SQL low-code reports and charts |

</div>

---

## Tech Stack

| Aspect | Description |
| --- | --- |
| JDK | 17+ |
| Spring Boot | 3.x |
| Database | MySQL · PostgreSQL · Oracle · SQL Server · H2 · MongoDB |
| Startup time | 2s ~ 5s |
| Devices | PC · Tablet · Mobile |
| License | Apache 2.0 |

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
