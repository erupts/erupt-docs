# Upgrade Guide

This document lists the notable changes for each Erupt release. Read the sections in version order.

## V 2.3.0 Upgrade Guide

This section covers what to watch for when upgrading from 2.2.x to 2.3.0.

### Requirements

| Item | Requirement |
| --- | --- |
| Erupt | Bump every dependency to `2.3.0` |
| Spring Boot | **3.5.16**, same as 2.2.x, nothing to change |
| JDK | **JDK 17** minimum, unchanged |
| Database | No minimum-version change; schema changes below |
| erupt-cloud-node | Projects using [erupt-cloud-node](/en/modules/cloud-node) **must upgrade the node service to 2.3.0 as well** |

### Step 1: Bump the dependency version

```xml
<properties>
    <erupt.version>2.3.0</erupt.version>
</properties>
```

Without a shared property, change the `<version>` of every `xyz.erupt` coordinate in `pom.xml` to `2.3.0`. **No** artifactId was renamed or retired in this release; 2.2.x coordinates keep working.

### Step 2: Add the new modules (optional)

2.3.0 open-sources five modules. Leaving them out changes nothing; adding one initializes its menus and tables on first start. `erupt-spring-boot-starter-all` already includes the first three.

| Module | artifactId | Purpose |
| --- | --- | --- |
| [Single sign-on](/en/modules/erupt-sso) | `erupt-sso` | OAuth2 / OIDC providers configured in the admin with 17 presets; the login page shows their buttons automatically, and erupt-notice can push to Feishu / DingTalk / WeCom / Slack through the same credentials |
| [Record comments](/en/modules/erupt-comment) | `erupt-comment` | A comment stream on any record; @mention notices need erupt-notice |
| [AI Decision](/en/modules/erupt-ai-decision) | `erupt-ai-decision` | Typed, probability-backed judgements; depends on erupt-data-jpa only |
| [DingTalk Notable data source](/en/modules/erupt-dingtalk) | `erupt-data-dingtalk` | Bind a DingTalk Notable sheet as an `@Erupt` model |
| [Airtable data source](/en/modules/erupt-airtable) | `erupt-data-airtable` | Bind an Airtable table as an `@Erupt` model |

:::tip erupt-sso needs a registered redirect URI
Each provider's redirect URI is `<erupt host>/erupt-api/sso/callback/<code>` and must match what is registered in the provider's console; see the [module page](/en/modules/erupt-sso#configuring-a-provider).
:::

### Breaking and behavioural changes

#### 1. The login lock is on by default <Badge type="warning" text="changed default" />

**Affects**: every project that signs in through erupt-upms.

Ten failed passwords for one account from one IP lock the pair for ten minutes; a wrong captcha counts too. Regular users will hardly ever hit it. Load tests, automated logins or many users behind one egress IP can tune or disable it:

```yaml
erupt:
  upms:
    login-lock:
      enable: true
      max-failures: 10
      lock-minutes: 10
```

#### 2. A password change signs out the other sessions

Whether the user changes their password or an admin uses **Reset Password**, every other session of that account is revoked at once; only the session that made the change stays. Automation that relied on old sessions surviving a password change needs adjusting.

#### 3. Account status, expiry and IP whitelist apply to every login path

The three checks moved into `EruptUserService.checkAccountUsable` and run for password logins, erupt-sso and custom `LoginProxy` logins alike. A project whose `LoginProxy` used to bypass them will now be refused.

#### 4. `logoPath: null` in `app.js` now means "no logo" <Badge type="warning" text="check app.js" />

**Affects**: projects whose `app.js` says `logoPath: null` (the 2.2.x template default) while still showing the bundled logo.

From 2.3.0 the three logo keys share one rule: **leave a key out** for the default (the bundled Erupt mark; collapsed and login logos follow `logoPath`), set it to **`null` or `''`** to show nothing in that slot. If the header logo disappears after upgrading, delete the `logoPath: null` line or point it at your own logo. A collapsed sidebar with no logo at all shows the site's initial instead of the Erupt mark.

#### 5. Strict validation of sort fields and condition keys

Sort fields and `queryColumn` condition keys must now be legal property paths (dotted Java identifiers), and condition values are bound as parameters. A client calling `/erupt-api/data/...` directly with an expression in `sort` (such as `id desc, (select ...)`) is refused; send field names only.

#### 6. erupt-generator rewritten

The generator moved from typing models in by hand to [importing them from a database](/en/modules/erupt-generator#import-from-database). `e_generator_class` / `e_generator_field` gain columns; old rows survive but lack the new column name, java type and similar fields, so re-importing is recommended. The per-field "unique" switch and the print button are gone, and the module no longer depends on freemarker or erupt-tpl.

#### 7. The `EruptUser` form is no longer a wizard

The four `DIVIDE` step markers (`accountStep` / `orgStep` / `pwdStep` / `securityStep`) became GROUP fields (`orgGroup` / `pwdGroup` / `securityGroup`). All are `@Transient`, so there is **no database impact**; only custom code that referenced those field names needs to change.

### Changed defaults worth knowing

| Item | 2.2.x | 2.3.0 |
| --- | --- | --- |
| `@BoolType(type)` | — | `AUTO`: a `notNull` BOOLEAN renders as a switch, others as radios; restore the old look with `@BoolType(type = BoolType.Type.RADIO)`, see [BOOLEAN](/en/field-types/boolean#widget-type) |
| Empty BOOLEAN table cell | Empty tag | Nothing |
| Row click opens the detail panel | On | Off (users can enable it in the settings drawer) |
| Whole-tree menu drag sorting | Supported | Removed, menus follow the server order; favorites still drag |
| `theme.customizable` | — | `true`; `false` locks the appearance for everyone |
| Attachment domain `fileDomain` | Set in `app.js` | Served by `/erupt-app`; an empty `app.js` value adopts it |
| Enum columns of new tables | Native enum / check constraint | Plain `VARCHAR`; existing tables untouched |
| `@Power(comment)` | — | `true`; with erupt-comment installed every model accepts comments, add `@Power(comment = false)` to sensitive ones |

### Database Changes

:::info
Hibernate applies these changes automatically at startup; run them by hand only when automatic DDL is disabled (`spring.jpa.hibernate.ddl-auto=none` or `validate`).
:::

The full SQL is in [2.3.0 Changelog → Database Changes](/en/guide/changelog#database-changes). It covers:

- `e_upms_user`: new columns `mfa_enabled`, `mfa_secret`, `mfa_recovery_codes`
- `e_generator_class`, `e_generator_field`: new columns (with erupt-generator)
- `e_remote_host`: new `file_transfer` column (with erupt-remote)
- Tables of the new modules, created by Hibernate: `e_upms_sso`, `e_upms_sso_role`, `e_upms_sso_bind` (erupt-sso); `e_record_comment` (erupt-comment); `e_ai_decision_def`, `e_ai_decision_model`, `e_ai_decision_question` (erupt-ai-decision)

### Post-upgrade Checklist

After restarting, confirm in order:

1. **Login lock thresholds** — 10 failures / 10 minutes by default; tune for load tests and automated logins (change 1)
2. **Header logo** — remove `logoPath: null` from `app.js` or set a real path (change 4)
3. **Custom LoginProxy** — make sure the account status / expiry / IP whitelist checks are what you expect for your login flow (change 3)
4. **Required BOOLEAN fields** — spot-check switches vs radios in forms and pin `@BoolType(type)` where needed
5. **MFA for administrators** — have every admin enrol in [two-factor authentication](/en/modules/erupt-upms/user#two-factor-authentication-mfa) from the avatar menu
6. **Projects adding erupt-comment** — add `@Power(comment = false)` to models that must not carry comments; @mention notices need erupt-notice
7. **Old erupt-generator rows** — they lack the new fields, re-import from the database
8. **Projects with automatic DDL disabled** — confirm the SQL above has been run
9. **Frontend cache** — the frontend changed a lot (skins, login page, form panel); force-refresh the browser if styles look off


## V 2.2.0 Upgrade Guide

This section covers the notable changes when upgrading from 2.1.x to 2.2.0.

### Requirements

| Item | Requirement |
| --- | --- |
| Erupt | Every dependency moves to `2.2.0` |
| Spring Boot | **3.5.16**, same as 2.1.x — nothing to change |
| JDK | **17** minimum, unchanged |
| Database | No minimum version change; schema changes are listed below |
| erupt-cloud-node | Projects using [erupt-cloud-node](/en/modules/cloud-node) **must upgrade their node services to 2.2.0 as well** |

### Step 1: Bump the dependency version

Most projects manage the version through one property, so this is the only edit:

```xml
<properties>
    <erupt.version>2.2.0</erupt.version>
</properties>
```

Without a shared property, change the `<version>` of every `xyz.erupt` coordinate in `pom.xml` to `2.2.0` — framework modules assemble against a matching version, and mixing versions fails at startup.

:::tip
Projects on [erupt-spring-boot-starter](/en/guide/quick-start) or `erupt-spring-boot-starter-all` only need the starter's own version bumped; it manages the submodules.
:::

This release renames **no** artifactIds and retires no modules, so 2.1.x coordinates carry over as they are.

### Step 2: Add the new modules (optional)

2.2.0 open-sources two modules. Skipping them changes nothing; adding one initializes its menu on the first startup, with no manual menu setup:

| Module | artifactId | Purpose |
| --- | --- | --- |
| [Model Atlas](/en/modules/erupt-atlas) | `erupt-atlas` | Model relation graph, lineage, coupling matrix, structural audit, and the Erupt class registry moved over from erupt-monitor |
| [Remote Access](/en/modules/erupt-remote) | `erupt-remote` | VNC desktops and SSH shells in the browser |

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-atlas</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

:::warning erupt-remote needs configuration
A multi-node deployment must give every node the same `erupt.remote.secret-key`, or credentials encrypted on one node cannot be decrypted on another. The reverse proxy also has to forward the WebSocket upgrade for `/erupt-remote` — see the [module docs](/en/modules/erupt-remote#nginx).
:::

### Breaking Changes

#### 1. User and role lists are no longer scoped to their creator <Badge type="warning" text="wider access" />

**Who is affected**: systems that grant the User Management or Role Management menu to non-admin users.

In 2.1.x `EruptUser` inherited a `@PreDataProxy` from `LookerSelf`, and `EruptRoleDataProxy` carried the same rule inline: a user whose `isAdmin` flag was false only saw rows whose `createUser` was itself.

The rule did not hold. `beforeFetch` applies to the list query, while reading, updating and deleting by id go through `verifyIdPermissions`, which builds its own query from the primary key alone. The rows were **hidden from the list but still readable, editable and deletable by id** — a boundary in appearance only.

As of 2.2.0, visibility for both models is decided by **menu and role permissions**, the way the rest of erupt works. `EruptUser` now extends `HyperModelCreatorVo` — `LookerSelf`'s own superclass — so the mapped columns are unchanged and **no schema migration is needed**. `LookerSelf` itself is kept: it is public API a downstream entity may still extend.

:::warning Review right after upgrading
This **widens access**: a non-admin holding the User or Role menu now sees every row. Check that those menus are assigned as intended.
:::

#### 2. erupt-designer data moves to SQLite

**Who is affected**: projects using [erupt-designer](/en/modules/erupt-designer) that already hold business data.

Designer model data no longer lives in the `e_designer_data` table of the main database. It moves to an embedded SQLite file (`data/designer.db` by default), with one real table per published design.

- **Nothing is migrated automatically**: re-publishing a design after the upgrade creates its new table. To keep existing rows, export them from `e_designer_data` as JSON and re-import.
- **The old table is left behind**: `e_designer_data` is neither read nor written any more, and Hibernate will not drop it. Once its data is migrated or no longer needed, drop it by hand with `DROP TABLE e_designer_data` (irreversible). The design config table `e_designer` stays in use — do not drop it.
- **Include it in your backups**: the file is separate from the main database; containerized deployments must mount it on a persistent volume or lose the data on rebuild.
- The design config itself (`e_designer`) is unaffected; the path is configurable with `erupt.designer.db-path`.

#### 3. Font Awesome 7

**Who is affected**: every project that customizes menu icons or `@Drill` / `@RowOperation` icons.

`font-awesome` 4.7 stopped in 2016; 2.2.0 moves to `@fortawesome/fontawesome-free` 7.x. Legacy class names keep resolving through `v4-shims` — of the 786 FA4 class names, only `meanpath` and `tripadvisor` lose a glyph.

One visual change: FA7 gives every `.fa` a default width of `1.25em` (FA4 had none), so icons sit in a uniform box. Set `--fa-width: auto` for the old metrics.

#### 4. The Erupt class registry moves from erupt-monitor to erupt-atlas

**Who is affected**: projects that use the **System Monitoring → Erupt Class Registry** menu, and code that references `xyz.erupt.monitor.model.EruptClassInfo`.

The class registry (`EruptClassInfo`) and its field drill (`EruptFieldInfo`) read the same live registry the model atlas draws. From 2.2.0 both live in [erupt-atlas](/en/modules/erupt-atlas#class-registry), under the `xyz.erupt.atlas` package instead of `xyz.erupt.monitor`; erupt-monitor is back to pure system monitoring (service, cache, diagnosis). Registry rows gain an **Open in Atlas** action that jumps straight to that model's relation graph.

Menu initialization **only adds, never moves**, so the existing `EruptClassInfo` / `EruptFieldInfo` menu rows stay under **System Monitoring**. Handle them according to your setup:

| Setup | After the upgrade | What to do |
| --- | --- | --- |
| Only `erupt-monitor` | The old menu points at a model that is no longer registered and fails to open | Add `erupt-atlas`, or delete **Erupt Class Registry** and the hidden `EruptFieldInfo` menu in menu management |
| `erupt-atlas` as well (including `erupt-spring-boot-starter-all`) | The old menu keeps working but stays under **System Monitoring**; the new **Model Atlas** root only holds **Model Graph** | Move **Erupt Class Registry** under **Model Atlas** in menu management, or delete the old menu and restart so the framework recreates it in the new place |
| Custom code referencing `xyz.erupt.monitor.model.*` or `EruptClassInfoDataService` | Compilation fails | Switch to `xyz.erupt.atlas.model.*` / `xyz.erupt.atlas.service.*` and make sure `erupt-atlas` is a dependency |

### Changed defaults worth knowing

| Item | 2.1.x | 2.2.0 |
| --- | --- | --- |
| `@Power(cellEdit)` | — | `true`; tables offer cell editing by default, see [@Power](/en/annotation/power#celledit-in-table-cell-editing) |
| `@Edit(ai)` | — | `true`; text fields offer the [AI writing assistant](/en/modules/erupt-ai/writing-assistant) |
| Frontend theme color | `#00B515` | `rgb(22, 119, 255)`, overridable with `theme.primaryColor` in `app.js` |
| Menu tree expand level | 5 levels | 1 level |

:::tip Tightening the defaults
- Rows that must always be changed as a reviewed whole: `@Erupt(power = @Power(cellEdit = false))`
- A field the grid should never edit: `@Edit(cellEdit = false)`
- A model AI must not touch at all: `@Erupt(power = @Power(ai = false))`
:::

### Database Changes

:::info
Schema changes are applied automatically by JPA / Hibernate at startup. Run them manually only if automatic DDL is disabled (`spring.jpa.hibernate.ddl-auto=none` or `validate`).
:::

The full SQL is in [2.2.0 Changelog → Database Changes](/en/guide/changelog#database-changes-1). It covers:

- `e_remote_host`: created when [erupt-remote](/en/modules/erupt-remote) is added; Hibernate builds it on its own
- `e_ai_canvas_model`: new table; `data_type` and `target_model` on `e_ai_canvas` are migrated and then dropped (when erupt-ai-canvas is used)
- `e_ai_chat_message`: new `images` column (when erupt-ai is used)
- `e_designer_data`: no longer used; drop it manually once its data is migrated (when erupt-designer is used)

### Post-upgrade Checklist

After restarting, verify in order:

1. **User / role menu grants** — non-admins now see every row of those two tables; confirm the grants are what you intend (breaking change 1).
2. **Cell editing on sensitive models** — tables offer cell editing by default. Add `@Power(cellEdit = false)` to models that must be changed as a reviewed whole, and `@Edit(cellEdit = false)` to fields a grid should never touch.
3. **AI writing assistant scope** — text fields offer it by default; add `@Power(ai = false)` to models AI must stay out of.
4. **Anonymous telemetry** — on by default; disable it with `erupt.telemetry.enabled=false` on intranet-only or compliance-sensitive deployments.
5. **erupt-designer volume** — containerized deployments should confirm `data/designer.db` is on a persistent volume and included in backups.
6. **Menu icons** — spot-check custom icons under Font Awesome 7, and look up replacements in the [FA7 library](https://fontawesome.com/search) if any are missing.
7. **Frontend cache** — the frontend changed substantially (theme system, icon set); hard-refresh the browser if styling looks wrong.
8. **Projects with automatic DDL disabled** — confirm the SQL above has been applied.
9. **Erupt Class Registry menu** — it moved to erupt-atlas with its model; confirm the old menu under **System Monitoring** still opens (erupt-atlas present) or has been deleted (breaking change 4).


## V 2.1.0 Upgrade Guide

This section covers the notable changes when upgrading from 2.0.x to 2.1.0.

### Requirements

1. Upgrade Spring Boot to **3.5.16** (projects using `<parent>` with `spring-boot-starter-parent` only need to change the version number).
2. JDK **17** is the minimum supported version (unchanged).
3. Change the Erupt version to `2.1.0` across all modules.
4. Projects using [erupt-cloud-node](/en/modules/cloud-node): **all node services must also be upgraded to 2.1.0**.

### Breaking Changes

#### 1. `erupt-jpa` Renamed to `erupt-data-jpa`

**Affected scope**: Projects that declare the `erupt-jpa` dependency explicitly in `pom.xml`.

2.1.0 folds the JPA data source into the erupt-data connector layer, so the **artifactId** changed from `erupt-jpa`
to `erupt-data-jpa`. The **Java package is unchanged** — it is still `xyz.erupt.jpa.*` (e.g.
`xyz.erupt.jpa.model.BaseModel`, `xyz.erupt.jpa.dao.EruptDao`) — so only the dependency coordinates need updating;
no application code changes are required.

```xml
<!-- Old (build fails: dependency not found) -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- New -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-jpa</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

#### 2. `erupt-mongodb` Renamed to `erupt-data-mongodb`

**Affected scope**: Projects that declare the `erupt-mongodb` dependency explicitly in `pom.xml`.

Same as JPA: the **artifactId** changed from `erupt-mongodb` to `erupt-data-mongodb`. The Java package is still
`xyz.erupt.mongodb.*`, so no application code changes are required.

```xml
<!-- Old (build fails: dependency not found) -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>

<!-- New -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-mongodb</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

:::tip
Projects using [erupt-spring-boot-starter](/en/guide/quick-start) or `erupt-spring-boot-starter-all` get these
dependencies from the starter and need no manual change.
:::

#### 3. The `erupt-tpl-ui.amis` Module Was Removed

**Affected scope**: Projects depending on the AMIS template integration module.

The AMIS integration inside `erupt-tpl-ui` (artifactId `erupt-tpl-ui.amis`) has been removed in 2.1.0. Delete the
dependency from your `pom.xml`:

```xml
<!-- No longer published — remove it -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui.amis</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

If your project renders AMIS pages, migrate to one of the other erupt-tpl skins (`erupt-tpl-ui.ant-design`,
`erupt-tpl-ui.element-ui`, `erupt-tpl-ui.element-plus`), or build custom pages with
[erupt-ai-canvas](/en/modules/erupt-ai-canvas). The artifactIds of those three skins are unchanged — only their
directory moved from `erupt-tpl-ui/` to `erupt-tpl/`, which does not affect dependency declarations.

## V 2.0.0 Upgrade Guide

This section covers the notable changes when upgrading from 1.14.x to 2.0.0.

### Requirements

1. Upgrade Spring Boot to **3.5.15** (projects using `<parent>` with `spring-boot-starter-parent` only need to change the version number).
2. JDK **17** is the minimum supported version (unchanged).
3. Change the Erupt version to `2.0.0` across all modules.
4. Projects using [erupt-cloud-node](/en/modules/cloud-node): **all node services must also be upgraded to 2.0.0**.

### Breaking Changes

#### 1. Password Encryption Upgraded (MD5 → SHA-512 + Salt)

**Affected scope**: All systems that use Erupt's built-in UPMS login.

After upgrading, the system uses SHA-512 with a random salt for newly created and reset passwords. **This change is backward compatible** — the `checkPwd` method in `EruptUserService` checks the `encryptType` column: users whose `encryptType` is null or `MD5` (i.e. all existing users) can still log in with their current passwords. Only new and reset passwords will use SHA-512 + salt going forward. Thanks to [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) for contributing this security improvement (Gitee [!35](https://gitee.com/erupt/erupt/pulls/35)).

**How to handle**:
- **No forced migration required**: Existing users can continue to log in without any action.
- **Optional batch migration**: If you want to upgrade all passwords to the new algorithm, use `SecretUtil.encodePassword(plaintext, salt)` to re-hash them and update the `password`, `salt`, and `encrypt_type` columns in the `e_upms_user` table.

#### 2. `DataProxy.extraContent` Signature Changed

**Affected scope**: Classes that implement `DataProxy` and override `extraContent`.

| | Old signature | New signature |
|---|---|---|
| Method | `default String extraContent(List<Condition> conditions)` | `default String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list)` |

The new second parameter `list` provides the current page's data rows, enabling dynamic HTML that references actual row values.

```java
// Old (must be updated if overridden)
@Override
public String extraContent(List<Condition> conditions) {
    return "<div>Custom content</div>";
}

// New
@Override
public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
    return "<div>Custom content — " + list.size() + " rows on this page</div>";
}
```

#### 3. `HTML_EDITOR` Default Editor Changed to CKEditor

**Affected scope**: Any module using the `EditType.HTML_EDITOR` field type.

In 2.0.0 the default rich-text editor for HTML_EDITOR has changed from **UEditor** to **CKEditor**. After upgrading, any HTML_EDITOR field that does not explicitly specify an editor type will automatically render with CKEditor.

**To keep using UEditor**, declare it explicitly via annotation:

```java
@Edit(
    type = EditType.HTML_EDITOR,
    htmlEditorType = @HtmlEditorType(type = HtmlEditorType.Type.UEDITOR)
)
private String content;
```

#### 4. `AutoCompleteHandler`, `ChoiceFetchHandler`, `TagsFetchHandler` Require a Generic Type Parameter

**Affected scope**: Classes that implement any of these interfaces.

The `fetchFilter` method's parameter type has changed from `Map<String, Object> formData` to the actual model object (generic `T`). The interfaces are now generic.

```java
// Old (compilation error after upgrade)
class MyHandler implements ChoiceFetchHandler {
    @Override
    public List<String> fetchFilter(Map<String, Object> formData, ...) {
        String value = (String) formData.get("someField");
        ...
    }
}

// New
class MyHandler implements ChoiceFetchHandler<MyEruptClass> {
    @Override
    public List<String> fetchFilter(MyEruptClass data, ...) {
        String value = data.getSomeField();
        ...
    }
}
```

The migration for `AutoCompleteHandler` and `TagsFetchHandler` follows the same pattern.

#### 5. Excel Import Template Format Changed from `.xls` to `.xlsx`

**Affected scope**: Users with cached or bookmarked import template download links.

The generated import template format has been upgraded from the legacy `.xls` to `.xlsx`. Clear your browser cache or re-download the template if you are using a previously downloaded file.

#### 6. `@Search.vague` Removed

**Affected scope**: Any field annotated with `@Search(vague = true)` or `@Search(vague = false)`.

```java
// Old (compilation error after upgrade)
@Edit(search = @Search(vague = true))
@Edit(search = @Search(vague = false))

// New
@Edit(search = @Search)            // equivalent to the old vague = true (advanced search is now the default)
@Edit(search = @Search(value = true)) // just enables search; no other change
```

Advanced search (range queries, fuzzy matching, etc.) is now the default behaviour for each component — no extra configuration needed.

#### 7. `EruptApiModel` Deleted

**Affected scope**: Any code that references `EruptApiModel.PromptWay`.

```java
// Old (compilation error after upgrade)
throw new EruptApiErrorTip("Error message", EruptApiModel.PromptWay.MESSAGE);
throw new EruptApiErrorTip("Error message", EruptApiModel.PromptWay.NOTIFY);

// New
throw new EruptApiErrorTip("Error message", R.PromptWay.MESSAGE);
throw new EruptApiErrorTip("Error message", R.PromptWay.NOTIFY);
```

If your project references `EruptApiModel` directly, replace it with `R<T>`:

```java
// Old
import xyz.erupt.core.view.EruptApiModel;

// New
import xyz.erupt.core.view.R;
```

#### 8. `ChoiceTrigger` Interface Removed

**Affected scope**: Classes that implemented `ChoiceTrigger`.

This interface was deprecated in earlier versions and has been removed in 2.0.0. Use `@ChoiceType.fetchHandler` instead:

```java
// New: implement a linked-selection handler
@Edit(
    choiceType = @ChoiceType(fetchHandler = MyChoiceFetchHandler.class)
)
```

See: [Choice → fetchHandler](/en/field-types/choice#dynamic-list)

#### 9. Login / Change-Password Endpoints Switched to HTTP POST

**Affected scope**: Custom login pages and any frontend code that calls these endpoints directly.

| Endpoint | Old method | New method |
|----------|-----------|-----------|
| `/erupt-api/erupt-user/login` | GET | POST |
| `/erupt-api/erupt-user/change-pwd` | GET | POST |

If you have a custom login page, change the corresponding AJAX calls from `GET` to `POST`.

### Quick API Migration Reference

| Old API | New API |
|---------|---------|
| `EruptApiModel.PromptWay.MESSAGE` | `R.PromptWay.MESSAGE` |
| `EruptApiModel.PromptWay.NOTIFY` | `R.PromptWay.NOTIFY` |
| `EruptApiModel.PromptWay.DIALOG` | `R.PromptWay.DIALOG` |
| `@Search(vague = true)` | `@Search` |
| `@Search(vague = false)` | `@Search(value = true)` |
| `ChoiceTrigger` interface | `@ChoiceType.fetchHandler` |
| `MD5Util` | `EncryptUtil` / `SecretUtil` |
| `EditType.COLLAPSE` | `EditType.GROUP` |

### Database Changes

:::info
All schema changes are applied automatically by JPA / Hibernate at startup. Manual DDL is only needed when your project has **disabled Hibernate auto-DDL** (`spring.jpa.hibernate.ddl-auto=none` or `validate`).
:::

#### New columns in `e_upms_user`

```sql
ALTER TABLE e_upms_user ADD COLUMN salt         VARCHAR(64);
ALTER TABLE e_upms_user ADD COLUMN encrypt_type VARCHAR(20);
```


### Required Upgrade Actions

:::warning
The following steps **must be completed before starting the application for the first time after the upgrade**. Skipping them will cause routing mismatches or blank pages in the affected modules.
:::

#### Step 1: Delete the `.erupt` directory

The `.erupt` directory (located in the JVM working directory) stores module-initialization marker files. Deleting it causes the framework to re-run all module menu-initialization logic on the next startup:

```bash
rm -rf .erupt
```

#### Step 2: Manually delete stale menus

Log in to the admin UI → System Settings → Menu Management, and delete the following menus as applicable:

##### If using erupt-monitor

2.0.0 **completely rewrites** erupt-monitor. The menu structure is entirely different from the old version and cannot be migrated automatically:

Find the **"System Monitor"** (or Monitor) root menu and delete all its child menus along with the root menu itself.

##### If using erupt-terminal

2.0.0 refactors the terminal module's frontend UI; the old route has changed:

Find the **"Terminal"** menu and delete it.

#### Step 3: Restart the application

After restarting, the system will automatically generate the latest menus for the affected modules.

## Previous Upgrade Guides

- [1.12.x → 1.13.x Upgrade Guide](https://www.yuque.com/erupts/1.13.x)
