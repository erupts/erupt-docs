---
title: "@Edit × EruptValueValidator × choice-validate: Why the Limits Declared on a Form Only Bind the Browser"
description: "Do the min, max, length and options you write on @Edit hold when an API call comes in? This issue takes apart EruptValueValidator: one annotation read by both the page and the server, 8 component types, 5 write entry points, and what it still does not check."
outline: deep
---

# Issue 19 · Declare Once, Enforce Everywhere

> In most low-code platforms a field rule is a UI setting in a designer: the browser stops you, but a direct call to the write endpoint may not. Erupt's `@Edit` is a Java annotation that the page and the server read **the same copy of**. `EruptValueValidator` runs the options, lengths, number ranges and date bounds a form declares once more inside the write pipeline, and it does so for Excel import, cell edits, sub-table rows and erupt-cloud node forwarding too.
>
> _Published 2026-10-15 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Follow the Erupt Official Account</div>
    <p class="topic-mp-qr__desc">Every issue is published there first, along with release notes, source walkthroughs and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why this issue

A small experiment. Declare three options on a status field (Draft / Published / Archived), then POST `status` as `"9"` straight to the write endpoint. You can never pick `9` on the page, but the endpoint doesn't go through the page.

Two weeks ago, the answer in the main repo was: **it gets written**. The dropdown existed only in the frontend, and the server had no idea `9` was illegal. `@Edit(notNull = true)`, regex and XSS checks had long been enforced server-side; "is the value among the options", "is the number in range" and "is the rating a multiple of 0.5" were not.

The claim this issue argues:

> **`@Edit` is a contract, not a skin.** What a form declares, the server must read again when it writes, because an API call, an Excel import, a script or another system never passes through that form.

## 2. Two approaches: validation belongs to the UI, or to the model

| Dimension | Validation belongs to the UI (common) | Validation belongs to the model (`EruptValueValidator`) |
|---|---|---|
| Where the rule lives | Field settings in a designer, run when the frontend renders | The `@Edit` annotation, read by reflection on the server |
| Calling the endpoint directly | Depends on whether the platform re-checks server-side | The same annotation runs again; the refusal names the field and the value |
| Times the rule is written | Once on the page, once more in the API contract | **Once**; page and server both read it |
| Bulk entry (import) | Often its own set of rules | Excel import calls the same method row by row |
| Cost | Low | One more reflection pass and option lookup per write (see the caching in §4) |

We don't think frontend validation is useless; it gives instant feedback. We think **server validation can't depend on frontend validation existing**.

## 3. Countable facts: 8 component types, 5 entry points

`xyz.erupt.core.util.EruptValueValidator` (in `erupt-core`, one class of about 300 lines) checks only the components whose meaning it can pin down:

```java
private static final Set<EditType> CHECKED = EnumSet.of(EditType.CHOICE, EditType.MULTI_CHOICE, EditType.INPUT,
        EditType.NUMBER, EditType.SLIDER, EditType.RATE, EditType.TAGS, EditType.DATE);
```

That is **8 types**, plus `TAB_TABLE_ADD` (the sub-table), which it recurses into row by row. It is called from **5 entry points**:

- add, edit and cell edit in `EruptModifyService`: 3 call sites;
- the import in `xyz.erupt.excel.controller.EruptExcelController`, row by row, with the row number in the error;
- `xyz.erupt.core.util.RemoteRequestValidator`: an erupt-cloud parent runs the same method against the `edit` JSON a node reported, **before** forwarding the write to the remote node.

What each type checks comes entirely from attributes already on the annotations; no new setting was added:

| Component | Declaration checked |
|---|---|
| `CHOICE` / `MULTI_CHOICE` | Value must be among the options: `vl`, enum constants, or what a `ChoiceFetchHandler` returns; `disable`d options don't count |
| `INPUT` | `inputType.length` |
| `NUMBER` | `numberType.min` / `max`, **only where declared** |
| `SLIDER` | `sliderType.min` / `max` |
| `RATE` | 0 to `count`; a 0.5 step only with `allowHalf` |
| `TAGS` | `maxTagCount`; with `allowExtension = false` every tag must be in `tags` or from `fetchHandler` |
| `DATE` | `pickerMode` of `FUTURE` / `HISTORY`, and `min` / `max` (date and date-time only) |
| `TAB_TABLE_ADD` | Each row runs the sub model's full rules: required, regex, XSS, `DataProxy#validate`, plus everything above |

The last row arrived with this commit (#426): **sub-table rows were not validated at all before.**

## 4. Four details that keep "strict" from becoming "unusable"

Strict server validation easily turns into a version nobody dares to upgrade to. Four places in the source leave room on purpose.

**1. Numbers are bounded only where you declared bounds.** `NumberType`'s `min` / `max` default to the `int` range, which a `Long` column may rightly exceed. So:

```java
case NUMBER -> {
    // the declared defaults are the int range, which a long column may rightly exceed: bound only what was set
    NumberType type = edit.numberType();
    Long min = type.min() == -Integer.MAX_VALUE ? null : type.min();
    Long max = type.max() == Integer.MAX_VALUE ? null : type.max();
    for (String one : submitted) range(edit, one, null == min ? null : BigDecimal.valueOf(min), null == max ? null : BigDecimal.valueOf(max));
}
```

**2. Unchanged values pass.** The first step is `submitted.removeAll(stored)`: on an edit, a value equal to the stored one isn't checked. Data saved before a rule tightened (a retired option, a lowered maximum) doesn't stop you editing the other fields of that record.

**3. Options are fetched once per request.** `options(...)` keeps the result in `MetaContext.getVars()` under "model | field | linkage value"; it dies with the request, with no cross-request cache. A linked dropdown (`dependField`) asks `EruptUtil.getChoiceListFilter` with the whole form, the same method the page calls when it asks for options.

**4. Only submitted fields, only types it is sure about.** A cell edit carries one field, so one field is checked. A `MULTI_FORM` block list or a reference object isn't in `CHECKED` and passes as is; a `CHOICE` that declares no options at all (no `vl`, no handler, not an enum) has nothing to check against and is skipped.

:::tip The counter-intuitive part
Option validation refuses `disable = true` options: "can't be picked on the page" means "can't be written through the API". But a **stored** record already holding that value isn't affected when you edit its other fields (detail 2). Retiring an option is therefore safe: it governs new writes and doesn't reach back into old data.
:::

## 5. The switches and the escape hatch

Option validation has two switches. Range validation has none:

```yaml
erupt:
  choice-validate: false   # off globally; default true (xyz.erupt.core.prop.EruptProp#choiceValidate)
```

```java
@EruptField(
        edit = @Edit(title = "Source", type = EditType.CHOICE,
                choiceType = @ChoiceType(
                        fetchHandler = SourceFetchHandler.class,
                        validate = false)))   // this field legitimately stores values outside the options
private String source;
```

`ChoiceType#validate` and `MultiChoiceType#validate` default to `true`. Length, number, rating and date bounds are **always enforced**: they are things you declared yourself, and there's no case for switching off your own declaration.

:::warning What you'll meet on upgrade
`erupt.choice-validate` is on by default (#421), which changes behaviour: data that used to be written through the API with a value outside the options is refused after the upgrade. The error tells you which: its form is `field title + is not one of the options → the value`. Where a field genuinely needs it, release that one field with `validate = false` instead of turning the check off globally.
:::

## 6. How does it compare with Yida / Jiandaoyun / Mingdaoyun?

We haven't tested these platforms item by item. The middle column lists **questions worth putting to each platform with an illegal value in hand**, not conclusions about them; their behaviour is for their own docs and your own testing to settle.

| Dimension | Domestic platforms: what to ask | Erupt |
|---|---|---|
| Value outside the options, written through the open API | Does the write endpoint of Yida, Jiandaoyun or Mingdaoyun re-check options? Try it once | Refused by default; `erupt.choice-validate` turns it off globally, `validate = false` per field |
| Number / date ranges through the API | Does a range configured on the field apply to the API too? | `NUMBER` / `SLIDER` / `RATE` / `DATE` are always checked; the error names the field and the value |
| Sub-table / detail rows | Do field rules in detail rows run per row on bulk writes? | `TAB_TABLE_ADD` runs the sub model's full rules per row, error prefixed `title #row` |
| Excel import | Is import held to the same rules as manual entry? | The same method, errors carry the row number |
| Where rules live | Designer settings, saved with the app | Java annotations, reviewed and versioned with your code |
| Existing data | What happens to old data after a rule tightens varies by platform | Unchanged values pass; only new writes are refused |

## 7. Up and running in 5 minutes

The full path from an empty project to a reachable admin page already has its own page:

**→ [Quick Start](/guide/quick-start)**

Once it runs, take any model with a `CHOICE` or `NUMBER` field and submit an illegal value straight to the write endpoint. The message should read `field title + is out of the allowed range → value`. Then go back to the table in §3 and check which components in your models are **not** among the 8.

## 8. Next issue

The same batch of commits holds a change that points outward: `erupt-webhook`, which subscribes to `EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent` and, **after** the transaction commits, POSTs the change to someone else, signed with HMAC-SHA256. Next time: **why "tell the outside world the data changed" doesn't belong in `DataProxy#afterAdd`**, and why a failed delivery's up-to-3 attempts happen off the request thread.

---

:::info Join the discussion
Source behind this issue: `erupt-core/.../util/EruptValueValidator.java`, `erupt-core/.../service/EruptModifyService.java` (three call sites), `erupt-core/.../util/RemoteRequestValidator.java`, `erupt-core/.../prop/EruptProp.java`, and `erupt-annotation/.../sub_field/sub_edit/ChoiceType.java`.

The time, month, week, quarter and year pickers don't have their bounds checked yet. Whether they should is up for a vote in [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
