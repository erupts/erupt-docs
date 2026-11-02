---
title: "PropertySource × @Value × EruptConfigRefreshedEvent: A Config Center Doesn't Have to Be Another Service"
description: "Every admin has a key/value 'system settings' table that someone must wrap in a hand-written cache. This issue dissects erupt-config: admin-edited settings as a layer of Spring's Environment, read by @Value and @ConfigurationProperties unchanged, live on save, and the cost of having no versions, canary or approvals."
outline: deep
---

# Issue 24 · A Config Center Doesn't Have to Be Another Service

> The "system settings" page of most admins is a key/value table plus a `getConfig("xxx")` helper. Callers manage their own cache, a change needs its own notification, and the table knows nothing about the same keys in `application.yml`. `erupt-config` goes the other way: no new read API, but the admin's settings become **the front-most `PropertySource` of the Spring environment**. `@Value` reads them as usual, and a save takes effect without a restart.
>
> _Published 2026-10-21 · ~9 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt WeChat account</div>
    <p class="topic-mp-qr__desc">Every issue is published there first, along with release notes, source walkthroughs and community showcases.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

"Where does the mail host live?", "who flips this feature switch?", "let operations change the promo banner's image and colour" — requests like these show up every quarter. There are three usual answers: put everything in `application.yml` (every change is a release); run a config center such as Nacos or Apollo (another service to deploy, and its UI is out of operations' reach); or build a "system parameters" table with a `ConfigUtil.get(key)`.

The third is the easiest and leaves three problems behind:

- **Two ways to read.** File settings use `@Value`, table settings use `ConfigUtil.get`; which source wins for a key depends on how the code was written.
- **You own the cache.** Querying on every read is slow; adding a cache means deciding invalidation yourself, and broadcasting it yourself across nodes.
- **No notion of environment.** dev and prod values are either mixed in one table behind prefixes or split into one database each.

The counter-thesis of this issue:

> **Runtime config needs neither a new read API nor a new service. Spring already has the abstraction for layered configuration: the `PropertySource`s inside `Environment`. Put the database items in there and change nothing else.**

## 2. Two approaches: a parallel API vs. a layer Spring already has

| Dimension | "Settings table + helper" | As a `PropertySource` (`erupt-config`) |
|---|---|---|
| How to read | `ConfigUtil.get("k")`, known only to your code | `@Value("${k}")`, `Environment#getProperty`, `@ConfigurationProperties` |
| Relation to files | Unaware of each other | Database in front, files as fallback; a missing key falls through |
| Environment layering | Prefixes or multiple databases | Reuses `spring.profiles.active`, active profiles layered over `default` |
| How a change lands | Write your own cache invalidation | Saving refreshes this node; Redis broadcast or polling tells the others |
| The admin page | Hand-write a CRUD | Three `@Erupt` models |

## 3. The countable facts: two tables, one startup hook, seventeen types

The module lives in `erupt-plugin/erupt-config`: 23 main source files, about 1,500 lines.

- **Two storage tables plus one read-only view model.** `xyz.erupt.config.model.ConfigProfile` (table `e_config_profile`, one row per profile), `ConfigItem` (table `e_config_item`, unique on `(profile, key)`), and `ConfigEffectiveValue` (the "Effective values" page: every property this instance reads right now, with the profile it came from).
- **One startup hook.** `xyz.erupt.config.boot.EruptConfigEnvironmentPostProcessor`, registered in `META-INF/spring.factories`, runs before any bean exists.
- **Seventeen value types.** In `ConfigValues`: `STRING / PASSWORD / TEXT / NUMBER / BOOLEAN / LIST / KEY_VALUE / JSON / YAML / DATE / DATETIME / TIME / COLOR / ICON / HTML / IMAGE / ATTACHMENT`. `KEY_VALUE`, `JSON` and `YAML` are flattened into `key.path` and `key[i]` properties the way Spring reads a yml file, so a `Map`, a `List` or a `@ConfigurationProperties` bean binds directly.
- **One event, one reader.** `EruptConfigRefreshedEvent` (carries the changed keys) and `EruptConfig` (typed `get` with defaults; the key may be an enum).

## 4. "Before any bean": how the database is read at startup

For `@Value` to see a setting it must be in the `Environment` before Spring creates the first bean, when JPA and `EruptDao` do not exist yet. `ConfigJdbcReader` uses plain JDBC:

```java
public static Map<String, Object> read(String url, String username, String password,
                                       List<String> profiles, boolean quoted) throws SQLException {
    try (Connection connection = DriverManager.getConnection(url, username, password)) {
        String q = quoted ? connection.getMetaData().getIdentifierQuoteString().trim() : "";
        UnaryOperator<String> id = name -> q + name + q;
        String sql = "select p." + id.apply(ConfigProfile.CODE_COLUMN) + ", i." + id.apply(ConfigItem.KEY_COLUMN)
                + ", i." + id.apply(ConfigItem.TYPE_COLUMN) + ", i." + id.apply(ConfigItem.VALUE_COLUMN)
                + ", i." + id.apply(ConfigItem.ENABLED_COLUMN) + " from " + id.apply(ConfigItem.TABLE) + " i join "
                + id.apply(ConfigProfile.TABLE) + " p on i." + id.apply(ConfigItem.PROFILE_COLUMN) + " = p." + id.apply("id")
                + " where p." + id.apply(ConfigProfile.CODE_COLUMN) + " in (" + String.join(",", Collections.nCopies(profiles.size(), "?")) + ")";
        // … layered in the order of profiles, a later layer overriding an earlier one
    }
}
```

Connection details come from `spring.datasource.*`; `EruptConfigEnvironmentPostProcessor` puts the merged map in with `addFirst`, **in front of every file**. Three details:

- **The layer order is Spring's.** `ConfigProfile.layers(environment)` returns `default` first, then `spring.profiles.active` (the default profiles when none is active); later wins — exactly how `application-{profile}.yml` sits over `application.yml`.
- **First boot does not fail.** When the tables do not exist yet, the `catch` logs one `warn` and the context starts on the files' values; JPA creates the tables afterwards.
- **Booleans are compared in Java, not in SQL.** The comment says it plainly: databases spell a boolean differently, so `enabled` is checked at `rows.getBoolean(5)`.

:::tip The counter-intuitive part
The module has **no read entry point of its own** for you to remember. The README's only enabling step is adding the dependency, and `spring.profiles.active` is "nothing erupt-specific". We think the biggest cost of a config center is not storage, it is **making every existing caller adopt a new way to read** — so there is no new way.
:::

## 5. "Live on save": a refresh is three steps, not a cache

The core of the runtime is `xyz.erupt.config.service.EruptConfigService#reload`:

```java
private synchronized Set<String> reload() {
    List<ConfigItem> items = this.items();           // enabled only, one query per layer to keep override order
    Map<String, Object> next = new LinkedHashMap<>();
    Map<String, Origin> from = new TreeMap<>();
    for (ConfigItem item : items) {
        Map<String, Object> flat = new LinkedHashMap<>();
        ConfigValues.flatten(item.getKey(), item.getType(), item.getValue(), flat);
        for (String key : flat.keySet()) from.put(key, new Origin(item.getKey(), item.getProfile().getCode(), item.getType(), Boolean.TRUE.equals(item.getSecret())));
        next.putAll(flat);
    }
    MutablePropertySources sources = environment.getPropertySources();
    Map<String, Object> previous = sources.contains(SOURCE) ? ((MapPropertySource) sources.get(SOURCE)).getSource() : Map.of();
    Set<String> changed = new TreeSet<>();
    for (String key : next.keySet()) if (!Objects.equals(previous.get(key), next.get(key))) changed.add(key);
    for (String key : previous.keySet()) if (!next.containsKey(key)) changed.add(key);
    // replace the PropertySource wholesale, set the @Value fields again, publish the event
    ...
}
```

When an item is saved, `ConfigItemDataProxy`'s `afterAdd / afterUpdate / afterDelete` each do one thing: `configService.refresh()`. Three things follow:

1. **Replace the PropertySource.** A new immutable map swaps the old one whole, so a thread mid-read always sees one complete version.
2. **Set the `@Value` fields again.** `ConfigValueRefresher` is a `BeanPostProcessor` that notes every singleton's `@Value` field containing `${...}` as the bean is created; on refresh each is re-resolved with `resolveRequiredPlaceholders` and `setField` runs only when the value changed. SpEL `#{...}` is left alone.
3. **Publish `EruptConfigRefreshedEvent`.** It carries the set of changed keys; code that must "rebuild a pool when a setting changes" just listens.

Across nodes:

- With `erupt.redis-session: true`, a committed change is broadcast through `RedisNotifier` on the `erupt-config:refresh` channel; the message is the sender's instance id, so a node skips its own.
- A cluster without Redis sets `erupt.config.refresh-seconds`, and a background thread calls `refreshIfChanged` — which compares one aggregate signature, the count and latest update time of enabled items, so **a quiet poll is two aggregate queries and reads no values**. Default 0; a single instance needs neither.

## 6. The admin page is `@Erupt` too

`ConfigItem` has seventeen value types but one `config_value` column. The form has one editor per type, switched by `@Dynamic` on `type`:

```java
@Transient
@EruptField(edit = @Edit(title = "Value", type = EditType.CODE_EDITOR,
        codeEditType = @CodeEditorType(language = "yaml"),
        desc = "A yml fragment; flattened into key.path properties the way Spring reads a file",
        dynamic = @Dynamic(dependField = "type", condition = "value === 'YAML'")))
private String yamlValue;
```

On save, `ConfigItemDataProxy#store` writes the editor of the item's type into `value`; `editBehavior` fills it back when the form opens. The profile tree on the left is `@LinkTree(field = "profile")`, "Copy to profile" is a `@RowOperation` with `ConfigItemHandler`, and a secret item shows `••••••` in the table while the application still reads it. Apart from the startup hook and the refresher there is **not one line of config-specific UI code** — the same idea as the webhook subscription table in Issue 22.

## 7. Versus RuoYi / JeecgBoot / Nacos / Apollo

We have not tested these products item by item. The left column is **what to ask when choosing**, not a verdict on them; check their official docs and try them yourself.

| Dimension | Domestic counterpart: what to ask | Erupt |
|---|---|---|
| How to read | In RuoYi's parameter settings or JeecgBoot's system config, must business code fetch by key through a dedicated service and manage its own cache? | `@Value("${k}")` / `Environment` / `@ConfigurationProperties`, plus a typed `EruptConfig#get` |
| Environment layering | Is there a profile layer in the parameter table? Are dev / prod separated by prefix, by database, or otherwise? | `ConfigProfile`, reuses `spring.profiles.active`, layered over `default` |
| Relation to files | Does a key missing from the database fall back to `application.yml`? | Yes: active profile > `default` > files |
| Separate service | Nacos / Apollo mean another service plus a client SDK | None: same process as the admin, reads the database through `spring.datasource.*` |
| Change governance | Do Nacos / Apollo offer history, canary and release approval? | **No**, see the last section |
| Admin page | Can operations use it directly, and how rich are the type editors? | 17 type editors, secret masking, copy to profile |

## 8. Five minutes to get going

From an empty project to a reachable admin page is its own page:

**→ [Quick Start](/guide/quick-start)**

`erupt-config` is an optional module: add `xyz.erupt:erupt-config`. The profiles it reads are simply Spring's `spring.profiles.active`; only a multi-node cluster without Redis sessions needs one more line, `erupt.config.refresh-seconds`. After startup a "Config" menu appears: create `app.mail.host`, then read it with `@Value("${app.mail.host:localhost}")`.

## 9. The cost, and next issue

This issue does not hide the costs; each can be matched in the source:

- **No versions, canary or approval.** A save overwrites. `ConfigItem` has an `enabled` switch but no "previous version" and no "send to one node first". If you need that governance, use a dedicated config center.
- **"Security" stops at masking.** Secret items show `••••••` in the table and form, yet the database holds plaintext; the `PASSWORD` type forces `secret = true` but does not encrypt at rest.
- **`@Value` is covered for field-injected placeholders only.** `ConfigValueRefresher` skips `#{...}` on purpose, and constructor or setter injection is resolved once at startup — listen to `EruptConfigRefreshedEvent` to react to changes.
- **Startup needs the database reachable.** When it is not, files apply — a fallback for first boot, not a high-availability design.
- **It is not a data dictionary.** `EruptDict` answers "which values may this field take" and feeds dropdowns; this module answers "what is this parameter right now" and feeds code.

Next issue swaps "configuration" for "delivery": the main repo gained `erupt-ai-dev`, which lets coding CLIs such as Claude Code and Codex change your git repositories on the server, one requirement card at a time. What we care about most is not whether it can write code but **which credential a process that can run commands should hold** — a per-run MCP token that points at one requirement, with permissions borrowed from the creator's AI roles.

---

:::info Join the discussion
Source covered in this issue: `erupt-plugin/erupt-config/.../boot/EruptConfigEnvironmentPostProcessor.java`, `boot/ConfigJdbcReader.java`, `boot/ConfigValues.java`, `service/EruptConfigService.java`, `service/ConfigValueRefresher.java`, `service/EruptConfig.java`, `model/ConfigItem.java`, `model/ConfigProfile.java`, `proxy/ConfigItemDataProxy.java`, and `erupt-test/.../config/ConfigTest.java`.

Should config items get version history, and should a change be pushable to chosen nodes first? Cast a vote in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
