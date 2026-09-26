---
title: "Generating Models from an Existing Database"
description: "In Issue 05 we said Erupt has no 'generate' verb. Now erupt-generator can read an existing database and derive @Erupt source from it. This issue explains why the two don't contradict each other: it produces exactly one file per table, generates once, then gets out of the way."
outline: deep
---

# Issue 14 · Generating Models from an Existing Database

> The code generators that ship with Chinese admin frameworks emit a layered stack: one table goes in, and out come a Controller, Service, Mapper, XML, a Vue page, and a snippet of menu SQL — after which that set of files and the generator have to be kept manually aligned forever. erupt-generator took a different route this week: it reads JDBC metadata, emits exactly one `@Erupt` class per table, never writes into your source tree, and leaves no trace at runtime. Our position: **the sooner a generator gets out of the way, the better — and the best kind is used only once.**
>
> _Published 2026-09-23 · ~10 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why We Wrote This

Issue 05 was titled "The most controllable low-code platform", and its thesis was that Erupt has no "generate" verb: it writes nothing into your source tree, and the only truth is the `.java` in Git.

On September 17, the main repo merged `erupt-generator: build erupt models by reading a database`. What it does is, quite literally, "generating": pick a data source, a schema, and a few tables, and out comes entity source annotated with `@Erupt` / `@EruptField`.

So this issue has to start by clearing something up: did we just contradict ourselves?

Our answer is no — but "generation" has to be split into two kinds:

- **Continuous generation**: the generator is the source of truth. Whenever the table structure or the canvas config changes, you regenerate, overwrite, and merge. The generated files are "derivatives" — edit one, and the next generation run fights you.
- **One-shot generation**: the generator is just a data-entry step. It copies what the database already knows (table names, column names, comments, types, foreign keys) into a class, hands it to you, and never looks at it again. From that moment on, the truth is the `.java` in your Git.

Issue 05 argued against the former. erupt-generator does only the latter — and "only the latter" is written into the source as a hard constraint (Section 5).

A real-world scenario also explains why it's needed: when you take over a legacy system, the database usually already holds two or three hundred tables, each with column comments like `状态 0-待支付 1-已支付 2-已取消` (status: 0 = pending payment, 1 = paid, 2 = cancelled). Hand-typing those into `@EruptField` one field at a time is the least skilled and most typo-prone step in the whole migration. The database already knows all of this; there's no reason to make a human type it again.

## 2. Two Kinds of Generation: A Layered Stack, or a Single File

| | Continuous generation (layered-template camp) | One-shot generation (Erupt) |
| --- | --- | --- |
| One table produces | Multiple backend layers + frontend page + menu script, typically 8–10 files | **1 `.java`** |
| Nature of the output | "Derived code" rendered from templates; edit it and you fork from the template | Ordinary source, indistinguishable from a hand-written entity |
| Generator at runtime | Generation config tables stay resident as the basis for future regeneration | Generation definitions are just an admin table; deleting them affects no business logic |
| Table structure changes | Go back to the generator to sync, then overwrite or hand-merge | Add a field in the IDE |
| Where the generator writes | Commonly straight into the project path, or packaged for download | **Preview and download only**; never touches the source tree |

The difference lies in what that one file contains. The layered camp needs 8 files because someone has to write the Controller, Service, Mapper, and pages; in Erupt, the UI, queries, and permissions are all driven by annotations, so one entity class is the whole thing. **A generator can be one-shot only if the framework itself needs no generated code.** That isn't the generator's achievement — it's a property the annotation approach had all along.

## 3. Counting: How Much It Can Read From Metadata

Every number from the `erupt-generator` rewrite can be checked against the source:

| Item | Count | Source |
| --- | --- | --- |
| Field types the generator can express | 39 | `xyz.erupt.generator.base.GeneratorType` enum |
| Of which inferable from metadata | 15 | `GeneratorType.of` / `ofString` + comment dictionaries + foreign keys |
| Selectable superclasses (decide which columns are inherited and skipped) | 12 + none | `xyz.erupt.generator.base.SuperModel` |
| Candidate names for a foreign key's display column | 9 (`name`, `title`, `label`, `code`…) | `DbIntrospectService.LABEL_CANDIDATES` |
| Module dependencies | 1 (`erupt-data-jpa`) | `erupt-plugin/erupt-generator/pom.xml` |
| Template engines | 0 (the former freemarker and erupt-tpl dependencies are gone) | `xyz.erupt.generator.service.CodeRender` |
| Files written into your source tree | 0 | Preview and Download are the only two exits |

39 minus 15 leaves 24 types (rich text, many-to-many, transfer, tree reference…) that metadata can't infer; they can only be fixed by hand after import. We don't intend to push that ratio higher: **`varchar(255)` won't tell you whether it holds rich text or a URL**, and guessing wrong is worse than not guessing.

## 4. Comments Are the Dictionary

The most valuable information in a legacy database is often not in the types but in the comments. Older Chinese systems rarely build a separate dictionary table for every status code; far more often, the dictionary is written straight into the column comment. `xyz.erupt.generator.base.ChoiceComment` exists specifically to read that kind of comment:

```java
// value on the left of a separator, label on the right, both kept short
private static final Pattern PAIR = Pattern.compile("([0-9A-Za-z_]{1,12})\\s*[-=:：]\\s*([^\\s,;、)，；）]{1,20})");

// one pair is a sentence, several are a convention
private static final int MIN_PAIRS = 2;

public static Choice parse(String comment) {
    if (null == comment) return null;
    Matcher matcher = PAIR.matcher(comment);
    Map<String, String> vl = new LinkedHashMap<>();
    boolean worded = false;
    int head = comment.length();
    while (matcher.find()) {
        // a label made only of digits comes from a date or a range, not from a dictionary
        if (!matcher.group(2).matches("[0-9]+")) worded = true;
        if (vl.isEmpty()) head = matcher.start();
        vl.putIfAbsent(matcher.group(1), matcher.group(2));
    }
    if (!worded || vl.size() < MIN_PAIRS) return null;
    // ...
}
```

Three rules deserve a closer look:

1. **At least two pairs make a dictionary.** `版本 v2-beta` (version v2-beta) has a single pair — it's a sentence, not a convention.
2. **Labels made only of digits don't count.** `有效期 1-30` (validity 1-30) is a range, `2024-06` is a date; neither is an enum.
3. **Whatever precedes the dictionary is the title.** In `状态 0-待支付 1-已支付`, `状态` (status) becomes `@Edit(title)`, and the value-label pairs after it become `@ChoiceType(vl = {...})`.

Foreign keys follow the same idea. `DbIntrospectService.link()` doesn't assume the referenced table has a `name` column; it actually reads that table's columns and picks the first one that exists, in the order `name → title → label → code → …`, as the display column. If none of them exist, it falls back to the first column other than the primary key. The resulting `@ReferenceTableType(id = "id", label = "...")` therefore references a column that really exists.

:::info Boundary
Foreign keys are recognized by **constraint** only; nothing is guessed from naming patterns like `xxx_id`. Plenty of old MySQL databases never declared foreign key constraints at all, and in that case `customer_id` is simply a `Long`. Guessing by name would be right seven times out of ten, and the other three would fail at runtime; we chose to let it degrade explicitly to a number.
:::

MySQL / MariaDB has one more trap: without `useInformationSchema` on the connection, JDBC's `REMARKS` comes back empty. `DbIntrospectService.comments()` detects the database product and reads comments from `information_schema` instead, using a parameterized `PreparedStatement`. Other databases go through the standard `REMARKS`.

## 5. Generate, Then Get Out of the Way

Take a MySQL table as an example:

```sql
create table customer (id bigint primary key, name varchar(64));
create table shop_order (
  id          bigint auto_increment primary key,
  order_no    varchar(32) not null comment '订单号',
  status      int not null comment '状态 0-待支付 1-已支付 2-已取消',
  customer_id bigint comment '客户',
  amount      decimal(12,2) comment '金额',
  foreign key (customer_id) references customer (id)
) comment '订单';
```

With `BaseModel` chosen as the superclass, the rules in `CodeRender.render()` produce exactly this one file:

```java
package com.example.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import xyz.erupt.annotation.*;
import xyz.erupt.annotation.sub_erupt.*;
import xyz.erupt.annotation.sub_field.*;
import xyz.erupt.annotation.sub_field.sub_edit.*;
import xyz.erupt.jpa.model.BaseModel;

/**
 * 订单
 */
@Erupt(name = "订单")
@Table(name = "shop_order")
@Entity
@Getter
@Setter
public class ShopOrder extends BaseModel {

    @EruptField(
            views = @View(title = "订单号"),
            edit = @Edit(title = "订单号", type = EditType.INPUT, search = @Search, notNull = true,
                    inputType = @InputType)
    )
    @Column(length = 32)
    private String orderNo;

    @EruptField(
            views = @View(title = "状态"),
            edit = @Edit(title = "状态", type = EditType.CHOICE, search = @Search, notNull = true,
                    choiceType = @ChoiceType(vl = {@VL(value = "0", label = "待支付"), @VL(value = "1", label = "已支付"), @VL(value = "2", label = "已取消")}))
    )
    private Integer status;

    @EruptField(
            views = @View(title = "客户"),
            edit = @Edit(title = "客户", type = EditType.REFERENCE_TABLE, search = @Search,
                    referenceTableType = @ReferenceTableType(id = "id", label = "name"))
    )
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @EruptField(
            views = @View(title = "金额"),
            edit = @Edit(title = "金额", type = EditType.NUMBER, search = @Search,
                    numberType = @NumberType)
    )
    private BigDecimal amount;

}
```

`id` is skipped because the superclass already declares it; `customer_id` drops its `_id` suffix to become the field `customer` while keeping `@JoinColumn(name = "customer_id")`; `@Column` appears only when it carries information JPA can't infer (a mismatched column name, a non-default length).

"Getting out of the way" shows up in the source in these places:

- **No manual creation.** `GeneratorClass` is annotated `@Power(add = false, print = false)`; definitions can only be imported from a database. Typing in a class name, a table, and every field by hand is re-entering what the database already knows; after import, the remaining form exists only to correct wrong guesses.
- **Only two exits.** `CodePreviewHandler` previews in the admin's code editor; `CodeDownloadHandler` downloads a single `.java`, or a zip for multiple classes, with zip entries carrying the package path so you can extract straight into `src/main/java` and have everything land in place. Not one line of the generator writes to your project directory.
- **No ownership of the output.** After generation the framework stops tracking the file. The only "look back" is a single check in `CodeRender`: if the class name is already taken by a registered Erupt model, a `//FIXME` line is added at the top of the code to warn you that pasting it in will conflict.
- **Re-import overwrites only the generator's own row.** When overwrite is checked, `DbImportHandler.exec()` deletes the old definition in `e_generator_class`; it never touches the entity you've already modified in Git.

The generator itself is also an `@Erupt` model: its definitions live in an ordinary admin table, and the list, edit form, and row buttons are all rendered by the framework. The annotations it uses to generate annotations are the very same set.

:::tip A counterintuitive takeaway
A code generator shouldn't be judged only by how many lines it generates the first time, but also by how long you still need it afterward. erupt-generator's target is zero: import, correct, download, and then you can remove the dependency from your pom.
:::

## 6. How Does It Compare to RuoYi / JeecgBoot / JNPF?

| Dimension | RuoYi code generation | JeecgBoot Online forms + code generation | JNPF visual development | **Erupt generator** |
| --- | --- | --- | --- | --- |
| One table produces | Backend domain / mapper / service / controller + frontend page + menu SQL | A full frontend-and-backend code set, or left in Online config and interpreted at runtime | Frontend and backend code | **1 `@Erupt` class** |
| Truth after generation | Generated code + generation config table, both need aligning | Online config and generated code coexist | Designer config and generated code coexist | **Only the `.java` in your Git** |
| Where status dictionaries come from | Manually pick a dictionary type per column | Pick a dictionary code in the form config | Configured in the designer | **Read automatically from column comments `0-xx 1-yy`** |
| Foreign keys | Master-detail tables configured by hand | Relations configured in the Online form | Configured in the designer | **Reads FK constraints, picks the display field from real columns** |
| Table structure changes later | Back to the generator to sync, regenerate, merge | Sync the database, regenerate | Back to the designer | **Add one `@EruptField` in the IDE** |
| Generator stays at runtime | Generation config tables resident | Online engine resident | Designer resident | **Not needed; can be removed from the pom** |

This table isn't about whose generator is more powerful. RuoYi's generator covers more ground than ours because it has more to generate in the first place. The difference is one step earlier: **how much code a framework needs generated determines whether its generator can be used just once.**

Equally, let's be clear about what we don't do:

- Tables with composite primary keys or no primary key are refused outright, because Erupt addresses a row by a single primary key (`DbIntrospectService.primaryKey()` accepts exactly one column);
- Comment dictionaries are recognized only in the "value + separator + label" shape like `0-禁用 1-启用` (0 = disabled, 1 = enabled); anything more elaborate is left as a plain number;
- Single-column unique indexes used to produce `@Column(unique = true)`; #382 on September 19 removed that along with the field, so imports no longer read unique indexes.

## 7. 5 Minutes From a Legacy Table to an Admin Page

Add one dependency to an Erupt project that's already running:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-generator</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

After restarting, open the "Code Generation" menu and click **Import from Database** above the list: data source, schema, and tables cascade three levels deep; `Package` defaults to the package where your existing models are most concentrated; `Ignore Columns` accepts wildcards like `tenant_*`. After import, Preview row by row; when it looks right, check multiple rows, Download, and extract the zip into `src/main/java`.

If you don't yet have a runnable Erupt project, start here:

**→ [Quick Start](/en/guide/quick-start)**

That page covers Maven dependencies, application.yml, the first @Erupt entity, the default login account, and Docker / K8S deployment.

Once it's running, treat the generated class as one you wrote yourself: the dictionary guessed wrong in Section 4, the rich text that couldn't be inferred in Section 5 — fix them directly in the IDE.

## 8. Next Issue Preview

This issue was about letting a program read the database and take repetitive work off people's hands. The next issue, **#15**, covers another kind of work done on people's behalf: judgment.

On September 22 the main repo added `erupt-ai/erupt-ai-decision`. It doesn't plug into a chat box; it answers only three kinds of questions: yes or no (`Noul`), pick one (`Choice`), and rate it (`Score`). Every answer carries a probability distribution, and business code uses it as the condition of an `if`:

```java
if (Decisions.of(ticket).ask(URGENT).yes(0.9)) escalate(ticket);
```

What we want to discuss: **when a large model enters backend business logic, perhaps what it should plug into isn't a generated paragraph of text but a boolean with a confidence attached.** Why yes/no answers don't report confidence separately, why the provider's key never leaves the server, why a Choice question returns your enum directly instead of a string — see you next issue.

---

:::info Join the discussion
Source covered in this issue: `erupt-plugin/erupt-generator/` (`DbIntrospectService`, `ChoiceComment`, `CodeRender`, `GeneratorType`, `SuperModel`, `DbImportHandler`), with tests in `erupt-test/src/test/java/xyz/erupt/test/generator/DbIntrospectTest.java`.

If your legacy database writes comments in an unusual style (`1启用 2停用`, `启用(Y)/停用(N)`…), come post a few samples on [GitHub Discussions](https://github.com/erupts/erupt/discussions); the `ChoiceComment` regex will be tightened or loosened against real data.
:::
