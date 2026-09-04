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

## Notes

When a user accesses the page, both **menu permissions** and annotation values are checked. If a feature is enabled in `@Power` but still not visible, verify that the corresponding menu permission is complete — any missing permissions must be added manually.
