# AI Writing Assistant for Forms <Badge type="tip" text="v2.2.0+" />

Text fields in the form carry an AI icon: open it and the model drafts the field, polishes it, continues it, shortens it or expands it. The draft streams back over SSE and **persists nothing** — the value only becomes real if the user keeps it and saves the form.

![AI writing assistant](/ai/ai-field-assistant-dark.jpg)

# It knows what it is writing

The model gets more than "write something". Erupt's annotations already describe the record: `@Erupt(name/desc)` says what kind of record it is, `@Edit(title/desc)` says what the field means, the other values on the same form come along as the brief, and `@Edit(prompt)` is the model owner's own authoring guidance for that field.

```java
@EruptField(
    views = @View(title = "Description"),
    edit = @Edit(
        title = "Description", type = EditType.MARKDOWN,
        prompt = "Written for shoppers: lead with benefits and use cases, no spec tables, under 300 words"
    )
)
private String detail;
```

A field length limit is passed as a hard constraint, and the output shape follows the component (`CODE_EDITOR` gets raw source only, `MARKDOWN` gets markdown, `HTML_EDITOR` an HTML fragment, `INPUT` a single line of plain text).

# Actions

| Action | Meaning |
| --- | --- |
| `GENERATE` | Write the field from scratch, based on the record |
| `POLISH` | Rewrite it to read better, keeping its meaning and its language |
| `CONTINUE` | Continue from exactly where the text stops, returning only the continuation |
| `SHORTEN` | Say the same thing in noticeably fewer words, keeping every fact |
| `EXPAND` | Say the same thing in more detail, faithful to what is there |
| `CUSTOM` | Apply the instruction the user typed |

# Scope and switches

Only **free-text** components carry it: `INPUT`, `TEXTAREA`, `HTML_EDITOR`, `CODE_EDITOR`, `MARKDOWN`. On every other component a `@Match` keeps `@Edit(ai)` off entirely.

| Level | Switch | Default |
| --- | --- | --- |
| Model | `@Erupt(power = @Power(ai = false))` | `true`; off shuts the assistant out of the model |
| Field | `@Edit(ai = false)` | `true` |

A call also requires `add` or `edit` power on the model — drafting is a write-side affordance, so a read-only user never gets it — and an enabled default chat model.

:::warning What never reaches the model
Values of `PASSWORD`, `ATTACHMENT`, `SIGNATURE`, `MAP`, `TPL` and `BUTTON` fields are **not** forwarded as context, and a long sibling value is cut down to 300 characters.
:::

Each call leaves one audit line: who, which model, which field, tokens and duration — and deliberately **no prompt and no generated text**, which are business data and do not belong in a log file.

