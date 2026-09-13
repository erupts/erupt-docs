# Permission Control @Power

The `@Power` annotation gives fine-grained control over which CRUD operations are enabled on an Erupt UI — add, delete, edit, query, import, and export.

> Controls the capabilities of an Erupt class: add, edit, delete, import, export, and more.

## Usage

```java
@Erupt(
       name = "Erupt",
       power = @Power(add = true, delete = true, 
                      edit = true, query = true, 
                      importable = false, export = false)
)
public class EruptTest extends BaseModel {
    
}
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `add` | boolean | true | Whether adding data is allowed |
| `delete` | boolean | true | Whether deleting data is allowed |
| `edit` | boolean | true | Whether editing data is allowed |
| `query` | boolean | true | Whether querying data is allowed |
| `viewDetails` | boolean | true | Whether viewing record details is allowed |
| `export` | boolean | false | Whether exporting data is allowed |
| `importable` | boolean | false | Whether importing data is allowed |
| `print` | boolean | true | Whether printing row data is allowed (1.14.1+) |
| `copy` | boolean | true | Whether to allow one-click row copy (2.0.0+) |
| `cellEdit` | boolean | true | Whether rows may be edited one cell at a time in the table (2.2.0+) |
| `ai` | boolean | true | Whether AI tools may inspect and operate on this model (2.1.0+) |
| `powerHandler` | Class | - | Implement this interface to control permissions dynamically |

## Annotation Definition

```java
public @interface Power {
    boolean add() default true; // add data

    boolean delete() default true; // delete data

    boolean edit() default true; // edit data

    boolean query() default true; // query data

    boolean viewDetails() default true; // view record details

    boolean export() default false; // export data

    boolean importable() default false; // import data

    boolean print() default true; // print row data (1.14.1+)

    boolean copy() default true; // one-click row copy (2.0.0+)

    // in-table cell editing (2.2.0+)
    boolean cellEdit() default true;

    // whether AI tools may inspect and operate on this model (2.1.0+)
    boolean ai() default true;

    // implement this interface to control permissions dynamically
    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

```java
public interface PowerHandler {

    /**
     * Dynamically control feature permissions
     * @param power  a simple POJO representing add/delete/edit/query capabilities
     */
    void handler(PowerObject power);

}
```

## print — Print Permission <Badge type="tip" text="v1.14.1+" />

`print` controls whether the row **print** entry is available. It is enabled by default; turn it off explicitly for models that do not need printing:

```java
@Erupt(name = "Example", power = @Power(print = false))
```

## ai — AI Access Switch <Badge type="tip" text="v2.1.0+" />

`ai` controls **whether AI tools may inspect and operate on this Erupt model**. Defaults to `true`.

:::warning A hard gate that sits above role authorization
`ai` is a **model-level** switch that outranks any role or menu grant: once `ai = false` is set on `@Erupt`, no amount of AI Tool permission granted to a role — and not even super-admin status — lets the AI read or modify that model's data through its tools.
:::

It is enforced inside the Erupt model toolbox of `erupt-ai-claw`:

- **Model listing**: `eruptModelList` skips every model whose `power().ai()` is `false`, so the AI cannot even see that it exists.
- **Per-model access**: `eruptSchema`, `eruptDataQuery`, `findEruptDataByPk`, `insertEruptData`, `updateEruptData` and `deleteEruptData` all run the same pre-check first. When `ai = false` it throws `AI access is disabled for this Erupt model: xxx`, and that check happens **before** the super-admin bypass branch.

```java
// Sensitive model: humans may still operate it in the admin UI, but the AI must not touch it
@Erupt(
    name = "User Account",
    power = @Power(ai = false)
)
public class SensitiveModel extends BaseModel {

}
```

For models that should stay AI-accessible, keeping `ai = true` is not enough on its own — the usual permission chain still applies: the current user must hold the menu permission for the model, and the matching `query` / `add` / `edit` / `delete` flags in `@Power` must be enabled.

:::tip
Erupts served by remote `erupt-cloud` nodes carry no local annotation, so the `ai` switch does not apply to them — the owning node runs its own permission pipeline.
:::

## cellEdit: In-table Cell Editing <Badge type="tip" text="v2.2.0+" />

`cellEdit` controls whether the table offers **in-place cell editing**. Defaults to `true`.

Double-click a cell (or its edit icon) to change one field without opening the row form. The floating editor is the row form's own `erupt-edit-type` component fed a one-field model, so value conversion, validation and the reference pickers behave identically, and the write goes through the single-field endpoint `POST /erupt-api/data/modify/{erupt}/update-cell`.

```java
// rows here should always be changed as a reviewed whole
@Erupt(name = "Settlement", power = @Power(cellEdit = false))
```

### One cell is validated as a whole row

The server serializes the stored row, patches it with the new value and **validates the whole row** — the same call the edit form makes. As a result:

- Every field's rules take part, so a cross-field invariant cannot be broken one cell at a time
- A [@Dynamic](/en/annotation/dynamic) rule that reads another field resolves correctly
- `DataProxy#beforeUpdate` / `afterUpdate` see a complete entity
- The operate log and edit event match a form submission

### Two switches, both enforced server side

| Level | Switch | Default |
| --- | --- | --- |
| Model | `@Erupt(power = @Power(cellEdit = false))` | `true` |
| Field | `@Edit(cellEdit = false)` | `true` |

Both are checked where the write happens: a crafted request to the single-field endpoint is rejected for a model or a field that opted out.

The field-level switch is for values the form should still edit but a grid cell should not — typically anything that grants access or changes identity. The framework opts out of exactly those: a user's account, admin flag, roles, org scopes, expiry, IP allowlist and status; a role's code and status; an open api key's secret, validity and status; the API domain of an LLM or embedding model; the agent url; and the BI datasource connection string.

```java
@EruptField(
    views = @View(title = "Status"),
    // status may only move through the workflow, never by a grid edit
    edit = @Edit(title = "Status", type = EditType.CHOICE, cellEdit = false)
)
private String status;
```

:::warning Fields rewritten in afterFetch
The cell editor seeds itself from the row the table query returned. If `DataProxy.afterFetch` rewrites a field for display (masking, formatting, turning it into markup), that display value is what gets written back. Rewrite view-only fields, or mark an editable one `@Edit(cellEdit = false)`.
:::

:::tip
Cell editing opens nothing new: the table still needs `edit` permission, tree menus and sub-tables have no grid to click, and collection fields (many-to-many and friends) stay out because the list query does not select their values.
:::

## Notes

When a user accesses the page, both **menu permissions** and annotation values are checked. If a feature is enabled in `@Power` but still not visible, verify that the corresponding menu permission is complete — any missing permissions must be added manually.
