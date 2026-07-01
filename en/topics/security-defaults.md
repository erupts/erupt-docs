---
title: "@Power × SHA512+Salt × PowerHandler: In Low-Code, 'Security' Shouldn't Be the Column You Fill In Right Before Launch"
description: For most domestic admin frameworks, the security checklist — RBAC menu permissions, button permissions, password encryption — is almost always a "fill it in before launch" to-do item. Erupt bets on the reverse: security is the default value of an annotation, the part the framework does for you. This issue works through the nine switches of @Power, the runtime enforcement of PowerHandler, and the smooth password migration from MD5 to SHA-512 + Salt, to make clear what "secure by default" means in engineering terms.
outline: deep
---

# Issue 06 · Secure by Default

> Almost every backend engineer has memorized the same "pre-launch security checklist": Are the permissions configured? Is export turned off? Is the password encrypted? Have you checked for privilege escalation? The very existence of this checklist says one thing — **in most frameworks, security is added after the fact**. Erupt bets on the opposite path: security is not a to-do item on a checklist, it is the default value of an annotation. A single `@Power` turns off export and import by default; change a password once, and an MD5 account is quietly migrated to SHA-512 with a salt — **there is no "configure security" step, because it's already in the defaults**.
>
> _Published 2026-06-10 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow Erupt on WeChat</div>
    <p class="topic-mp-qr__desc">Each issue is published here first, along with release notes, source code walkthroughs, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why This Article

Flip through the "quick start" guides of domestic admin frameworks, and the security narrative is remarkably consistent: get the features working first, then come back and configure permissions. RuoYi's menu permissions and button permissions have to be checked off one by one in role management; JeecgBoot's data permission rules have to be created manually in a "data rule" table; JNPF's feature permissions hang off a visual permission tree. They're all quite complete — **the problem isn't whether they do it, it's that these things are "off by default, waiting for you to turn on," or worse, "on by default, waiting for you to turn off."**

The latter is where things really go wrong. On a freshly created entity management page, is the export button there by default? Is data import usable by default? Is copying a record allowed by default? As long as the default is "on," then "forgetting to turn it off" is a data leak. A security checklist is called a checklist precisely because it assumes you'll miss something.

This issue is about Erupt's other approach: **make security the default value of an annotation, and delete "forgetting to turn it off" from the realm of possibility**. The argument centers on two pieces of real source code — the `@Power` annotation (static defaults for operation-level permissions + runtime enforcement) and a recent password algorithm upgrade (the smooth migration from MD5 to SHA-512 + Salt).

::: tip A Counterintuitive Summary
"Feature-complete" and "secure by default" are two different things. RuoYi, JeecgBoot, and JNPF are all strong on "feature-complete" — their permission models have everything they should. But their default posture is "everything on, waiting for you to configure." Erupt's default posture is "sensitive operations off by default, waiting for you to explicitly turn on." **The failure mode of the former is a leak; the failure mode of the latter is an error** — the latter is far cheaper.
:::

## 2. Two Security Postures

Lay out the security models of admin frameworks side by side, and the essential difference is just one thing: **which side the default value stands on.**

Let's clear one thing up first, to avoid being misread: **Erupt does not "lack role management"**. erupt-upms has full RBAC — `EruptRole`, `EruptMenu` (menu/button permissions are stored in the database and toggled in the UI at runtime), isomorphic with RuoYi and JeecgBoot's setup. The difference this issue is about isn't "whether there's a role table," it's **which layer the default value for operational capabilities lands on**:

| Security Posture | The "configure-then-launch" camp | The "secure by default" camp (Erupt) |
| --- | --- | --- |
| Export/import on new pages | Available by default, reined in by role permissions | `export`/`importable` **default to false at the annotation layer** |
| Default baseline of operational capabilities | Decided by role/permission tables, no default at the annotation layer | `@Power` gives a conservative default, role tables layer on top |
| Row-level / dynamic permissions | Write SQL data rules or interceptors | Implement the `PowerHandler` interface, enforced at runtime |
| Password storage | You pick the algorithm; misconfigure it and it's MD5 | SHA-512 + random salt built into the framework |
| Legacy password migration | Usually requires writing a script for bulk rehash | **Automatically upgraded** on the next login/password change |
| Failure mode | Forgot to configure → data leak | Forgot to turn on → feature error |

The last row is the crux of the whole piece. Neither posture can be "zero mistakes"; the difference is in **the cost of a mistake**: forget to turn off export, and what leaks is real data; forget to turn on some feature, and the worst case is a user can't click a button and files you an issue. Erupt chooses the latter.

## 3. One Annotation, Nine Switches

`@Power` is Erupt's operation-level permission annotation, attached to the `@Erupt` model. It isn't "the configuration entry point for a permission system" — it **is the permission declaration itself** — nine boolean switches + one dynamic extension point, all with default values:

```java
package xyz.erupt.annotation.sub_erupt;

public @interface Power {

    boolean add() default true;

    boolean edit() default true;

    boolean delete() default true;

    boolean query() default true;

    boolean viewDetails() default true;

    boolean export() default false;       // Note: off by default

    boolean importable() default false;   // Note: off by default

    boolean print() default true;

    boolean copy() default true;

    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

Look at how the defaults are distributed: create/read/update/delete, view details, print, and copy are on by default — these are everyday operations, and turning them off would be awkward. But **`export` and `importable` default to `false`**. These two happen to be the operations most likely to cause a data accident: bulk export can drag away an entire table, and bulk import can bypass form validation and write dirty data. Erupt's judgment is: **the default value should stand on the side where "getting it wrong costs the most"**, so these two are off by default, and whoever needs them writes `export = true` explicitly.

`copy()` is a switch added in this version (the ninth boolean slot in the `Power` annotation). Its existence says one thing: whenever the framework adds a new class of operational capability, the permission model is **extended in lockstep**, rather than "ship the feature first, add the permission next version." The moment a new capability arrives, its switch arrives with it.

::: info @Power and role management are two layers, not either/or
`@Power` doesn't replace RBAC. Erupt's permissions are layered: `@Power` is the **compile-time default baseline** — it decides whether an operation "exists and is open by default"; erupt-upms's `EruptRole` / `EruptMenu` are the **runtime role overlay** — they decide "which role can actually use which menu/button," stored in the database and checked off in the UI. `PowerHandler` (see §4) is the dynamic enforcement in between, based on the currently logged-in user. All three layers lean conservative, and the business opens things up layer by layer from the bottom. This issue focuses on that bottom layer, because that's precisely the layer where competitors have no default value.
:::

## 4. PowerHandler: Enforcing the Static Default into a Runtime Decision

The nine switches of `@Power` are static, fixed at compile time. But in real business, permissions are often dynamic — "an ordinary support agent can only view, not export; a supervisor can export." Here you don't need to change the annotation; instead you implement the `PowerHandler` interface and attach it to `powerHandler()`:

```java
package xyz.erupt.annotation.fun;

public interface PowerHandler {

    // Dynamically decide each feature's switch at runtime based on the currently logged-in user
    void handler(PowerObject power);
}
```

`PowerObject` carries runtime switches that correspond one-to-one with `@Power`, and `handler` is called each time permissions are built for a request. In other words: **the static annotation gives the default baseline, and `PowerHandler` gives the runtime enforcement** — both layers lean conservative, and the business opens things up as needed.

One common misconception to clear up here: Erupt's dynamic behavior **does not go through SpEL expressions**. All "decide dynamically per user/per role" logic goes through the Handler interfaces under `xyz.erupt.annotation.fun.*` — `PowerHandler`, `FilterHandler` (row-level filtering), `OperationHandler` (custom operations). They are ordinary Spring Beans — you can inject services, set breakpoints, and write unit tests. Permission logic is therefore **debuggable, reviewable, Git-diffable** Java, not a single line of string in a config table.

## 5. Passwords: The Smooth Migration from MD5 to SHA-512 + Salt

Operation-level permissions are "who can do what"; passwords are "how credentials are stored." Erupt recently upgraded the password algorithm from MD5 to **SHA-512 + random salt**. But what's truly worth discussing isn't the algorithm itself — SHA-512 with a salt is table stakes — it's **the migration**: no downtime, no bulk rehash script, no "all users please reset your password" announcement.

The mechanism comes down to two things: verification recognizes both algorithms at once — legacy MD5 accounts log in as usual, new accounts use SHA-512 with a salt; and whenever a user **naturally changes their password**, the framework upgrades that record to SHA-512 + salt along the way. New users go straight to the new algorithm, and existing users are incrementally migrated through everyday password changes. The implementation is centered in `xyz.erupt.core.util.MD5Util` and `xyz.erupt.upms.service.EruptUserService`, and integrators don't need to worry about the details.

::: info Why this is part of "secure by default"
As an integrator, you **never chose an encryption algorithm anywhere**. You write an `@Erupt` entity, configure upms, and the password is stored as SHA-512 with a salt; upgrade the framework version, and existing accounts are automatically and smoothly migrated. Security here isn't a decision you have to make — it's something the framework does for you by default, which is exactly the "secure by default" this issue is about.
:::

## 6. How Does It Compare to RuoYi / JeecgBoot / JNPF?

| Dimension | RuoYi / JeecgBoot / JNPF | Erupt |
| --- | --- | --- |
| Role/menu RBAC | Yes — role table + menu/button permissions | Yes — `EruptRole` / `EruptMenu` (isomorphic) |
| Default baseline of operational capabilities | Decided by role/permission tables, no annotation-layer default | `@Power` annotation-layer defaults + role table overlay |
| Export/import default | Mostly open by default, reined in by role permissions | `export`/`importable` **default to false at the annotation layer** |
| Dynamic permissions | Data rule SQL / custom interceptors | `PowerHandler` — an ordinary Spring Bean, debuggable and unit-testable |
| Default password algorithm | Depends on the version; historically MD5/plaintext | SHA-512 + random salt built in |
| Legacy password migration | Usually requires a hand-written bulk script | Auto-upgraded on password change, no downtime |
| Permission logic reviewable | Role config stored in the database, hard to put in a diff | Default baseline + Handler are `.java`, visible in `git diff` |

This table isn't saying RuoYi/JeecgBoot/JNPF are "insecure," nor that they "lack RBAC" — their role/menu permission models are quite complete, their communities are mature, and Erupt is isomorphic with them at that layer. The difference is only in **that extra layer of annotation defaults**: when the floor for operational capabilities is left entirely to "whether the person configuring missed something," the failure mode is a leak; when the framework first presses down a conservative default at the annotation layer, the failure mode degrades to an error. For scenarios like one-person companies, small teams, and outsourced deliveries — where there's no dedicated security engineer watching the checklist — this extra layer of fallback gives you far more room for error.

## 7. From Annotation to a Permissioned Page in 5 Minutes

The complete flow from an empty Spring Boot project to a login-capable admin page with operation permissions has been split out into its own article:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, application.yml, your first `@Erupt` entity, the default login account, and Docker / K8S deployment.

Once it's running, adding one line of permission declaration to your entity wires up the capabilities from §3 and §4 of this article:

```java
@Erupt(
    name = "订单",
    power = @Power(
        export = true,                  // Explicitly enable export
        importable = false,             // Keep import disabled
        powerHandler = OrderPowerHandler.class  // Runtime enforcement by role
    )
)
@Entity
public class Order { /* ... */ }
```

`OrderPowerHandler` implements `PowerHandler`, injects your service, and decides `power.setExport(...)` based on the currently logged-in user. As for the password part, **you don't need to do anything** — plug in erupt-upms and it's SHA-512 with a salt by default.

## 8. Next Issue Preview

This issue was about "which side the default value of a sensitive operation stands on." But there's a finer layer of permissions — **field-level**: on the same table, role A can see the phone number, while role B only sees the masked last few digits. How do Erupt's field visibility, masking, and row-level filtering (`FilterHandler`) get declared alongside `@EruptField`? Next issue, **#07**, drills permissions down from "operation-level" to "field-level and row-level," continuing this thread of "secure by default."

---
:::info Join the Discussion
The core source code for this issue: `xyz.erupt.annotation.sub_erupt.Power`, `xyz.erupt.annotation.fun.PowerHandler`, `xyz.erupt.core.util.MD5Util`, `xyz.erupt.upms.service.EruptUserService`. Feel free to post about your permission-design pitfalls in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
