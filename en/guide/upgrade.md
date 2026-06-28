# V 2.0.0 Upgrade Guide

This document covers the notable changes when upgrading from 1.14.x to 2.0.0.

## Requirements

1. Upgrade Spring Boot to **3.5.15** (projects using `<parent>` with `spring-boot-starter-parent` only need to change the version number).
2. JDK **17** is the minimum supported version (unchanged).
3. Change the Erupt version to `2.0.0` across all modules.
4. Projects using [erupt-cloud-node](/en/modules/erupt-cloud-node): **all node services must also be upgraded to 2.0.0**.

## Breaking Changes

### 1. Password Encryption Upgraded (MD5 → SHA-512 + Salt)

**Affected scope**: All systems that use Erupt's built-in UPMS login.

After upgrading, the system uses SHA-512 with a random salt for newly created and reset passwords. **This change is backward compatible** — the `checkPwd` method in `EruptUserService` checks the `encryptType` column: users whose `encryptType` is null or `MD5` (i.e. all existing users) can still log in with their current passwords. Only new and reset passwords will use SHA-512 + salt going forward. Thanks to [段鹏鹏](https://gitee.com/erupt/erupt/pulls/35) for contributing this security improvement (Gitee [!35](https://gitee.com/erupt/erupt/pulls/35)).

**How to handle**:
- **No forced migration required**: Existing users can continue to log in without any action.
- **Optional batch migration**: If you want to upgrade all passwords to the new algorithm, use `SecretUtil.encodePassword(plaintext, salt)` to re-hash them and update the `password`, `salt`, and `encrypt_type` columns in the `e_upms_user` table.

### 2. `DataProxy.extraContent` Signature Changed

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

### 3. `HTMLEDITOR` Default Editor Changed to CKEditor

**Affected scope**: Any module using the `EditType.HTMLEDITOR` field type.

In 2.0.0 the default rich-text editor for HTMLEDITOR has changed from **UEditor** to **CKEditor**. After upgrading, any HTMLEDITOR field that does not explicitly specify an editor type will automatically render with CKEditor.

**To keep using UEditor**, declare it explicitly via annotation:

```java
@Edit(
    type = EditType.HTMLEDITOR,
    htmlEditorType = @HtmlEditorType(type = HtmlEditorType.Type.UEDITOR)
)
private String content;
```

### 4. `AutoCompleteHandler`, `ChoiceFetchHandler`, `TagsFetchHandler` Require a Generic Type Parameter

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

### 5. Excel Import Template Format Changed from `.xls` to `.xlsx`

**Affected scope**: Users with cached or bookmarked import template download links.

The generated import template format has been upgraded from the legacy `.xls` to `.xlsx`. Clear your browser cache or re-download the template if you are using a previously downloaded file.

### 6. `@Search.vague` Removed

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

### 7. `EruptApiModel` Deleted

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

### 8. `ChoiceTrigger` Interface Removed

**Affected scope**: Classes that implemented `ChoiceTrigger`.

This interface was deprecated in earlier versions and has been removed in 2.0.0. Use `@ChoiceType.fetchHandler` instead:

```java
// New: implement a linked-selection handler
@Edit(
    choiceType = @ChoiceType(fetchHandler = MyChoiceFetchHandler.class)
)
```

See: [Choice → fetchHandler](/en/field-types/choice#S1jRs)

### 9. Login / Change-Password Endpoints Switched to HTTP POST

**Affected scope**: Custom login pages and any frontend code that calls these endpoints directly.

| Endpoint | Old method | New method |
|----------|-----------|-----------|
| `/erupt-api/erupt-user/login` | GET | POST |
| `/erupt-api/erupt-user/change-pwd` | GET | POST |

If you have a custom login page, change the corresponding AJAX calls from `GET` to `POST`.

## Quick API Migration Reference

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

## Database Changes

:::info
All schema changes are applied automatically by JPA / Hibernate at startup. Manual DDL is only needed when your project has **disabled Hibernate auto-DDL** (`spring.jpa.hibernate.ddl-auto=none` or `validate`).
:::

### New columns in `e_upms_user`

```sql
ALTER TABLE e_upms_user ADD COLUMN salt         VARCHAR(64);
ALTER TABLE e_upms_user ADD COLUMN encrypt_type VARCHAR(20);
```


## Required Upgrade Actions

:::warning
The following steps **must be completed before starting the application for the first time after the upgrade**. Skipping them will cause routing mismatches or blank pages in the affected modules.
:::

### Step 1: Delete the `.erupt` directory

The `.erupt` directory (located in the JVM working directory) stores module-initialization marker files. Deleting it causes the framework to re-run all module menu-initialization logic on the next startup:

```bash
rm -rf .erupt
```

### Step 2: Manually delete stale menus

Log in to the admin UI → System Settings → Menu Management, and delete the following menus as applicable:

#### If using erupt-monitor

2.0.0 **completely rewrites** erupt-monitor. The menu structure is entirely different from the old version and cannot be migrated automatically:

Find the **"System Monitor"** (or Monitor) root menu and delete all its child menus along with the root menu itself.

#### If using erupt-terminal

2.0.0 refactors the terminal module's frontend UI; the old route has changed:

Find the **"Terminal"** menu and delete it.

### Step 3: Restart the application

After restarting, the system will automatically generate the latest menus for the affected modules.

## Previous Upgrade Guides

- [1.12.x → 1.13.x Upgrade Guide](https://www.yuque.com/erupts/1.13.x)
