# Divider DIVIDE

Inserts a horizontal dividing line in the form to visually group fields. No data is stored.

![divide](/field-types/divide.png)

## Basic Usage

```java
@Transient
@EruptField(
    edit = @Edit(title = "-- Basic Information --", type = EditType.DIVIDE)
)
private String divide;
```

## Semantics Under formSteps <Badge type="tip" text="v2.1.1+" />

When the owning Erupt class declares `@Erupt(layout = @Layout(formSteps = true))`, `DIVIDE` no longer renders a divider line — it is **promoted to a step boundary** of the form wizard:

| | Default mode | `formSteps = true` |
|---|---|---|
| Rendering | A horizontal divider line | No divider; rendered as the steps header at the top |
| Role of `title` | Text shown on the divider | The **step title** |
| Role of `desc` | Unused | The **step description** |
| Field grouping | Visual grouping only | Fields between two `DIVIDE` markers belong to the preceding step |

Other things to be aware of:

- Only `DIVIDE` fields with `show = true` and a non-empty `title` are recognised as steps; when no step is recognised, the form falls back to normal mode
- Fields declared before the first `DIVIDE` belong to the first step
- Clicking **Next** validates **only the required fields of the current step**; the wizard will not advance until they pass
- Sub-tables rendered as tabs (`TAB_TABLE_ADD` / `TAB_TABLE_REFER` / `TAB_TREE`) do not take part in the stepping and are always shown on the **last step**

```java
@Erupt(name = "Step Form", layout = @Layout(formSteps = true))
public class StepForm extends BaseModel {

    @Transient
    @EruptField(edit = @Edit(title = "Basic Info", desc = "Who you are", type = EditType.DIVIDE))
    private String step1;

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name", notNull = true))
    private String name;

    @Transient
    @EruptField(edit = @Edit(title = "Contact", desc = "How to reach you", type = EditType.DIVIDE))
    private String step2;

    @EruptField(views = @View(title = "Email"), edit = @Edit(title = "Email", notNull = true))
    private String email;

}
```

:::tip
See [Step Form formSteps](/en/annotation/form-steps) and [@Layout](/en/annotation/layout) for the full description.
:::
