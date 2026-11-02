---
title: "NOUL × CHOICE × SCORE: The Threshold for an AI Judgement Belongs in Your Code"
description: "Workflow AI nodes emit a paragraph of text, and a downstream branch tries to guess what it meant. erupt-ai-decision takes another route: questions are typed, answers are probabilities, and the threshold stays in your if statement. This issue explains why judging and deciding must be split apart."
outline: deep
---

# Issue 15 · Putting AI Judgements Back Inside an if Statement

> When Chinese low-code platforms add AI to workflows, the most common shape is an "LLM node": a prompt goes in, a paragraph comes out, and a downstream condition branch string-matches that paragraph. erupt-ai-decision landed in the main repo over the last two weeks. It produces no text at all; it answers only three kinds of typed questions — yes / no, pick one, ordered score — and every answer carries a probability distribution. Our position: **the model says "how much it looks like", the code says "whether it counts", and the threshold must never be handed to the model.**
>
> _Published 2026-10-01 · ~10 min read_

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

Break most AI requirements in an admin system down far enough and they are not about *generating* — they are about *judging*: is this ticket urgent, which team gets it, how angry is the customer, does this refund request need a human review.

The downstream of a judgement is an `if`. The native output of a large language model is a paragraph. The glue between the two — "answer only yes or no" in the prompt, `contains("yes")` on the result, a fallback for "yes, but…" — is the most fragile link in most AI workflows today.

Issue 01 covered the erupt-ai harness: 50+ models, A2A, Memory — the question of "how do I get an agent running". This issue's erupt-ai-decision answers a different question: **when business code only needs a value it can branch on, why route it through a paragraph at all?**

It entered the main repo in `2ee84e8eb Add erupt-ai-decision: typed judgements a program can branch on`, and `a95daf280` then added Laya, which you can deploy locally. The module does not depend on erupt-ai; it depends only on erupt-data-jpa.

## 2. Two Paradigms: Text Nodes vs Typed Judgements

| | Text-node paradigm | Typed-judgement paradigm (erupt-ai-decision) |
|---|---|---|
| What you send the model | A prompt with "output only A/B/C" tucked inside | A state plus a few typed questions |
| What the model returns | A paragraph (or JSON you hope is valid) | `{ "noul": 0.93 }`, `{ "choice": "BILLING", "probabilities": {...} }` |
| Where the threshold lives | Implicitly, at the moment the model "feels" it's a yes | In the caller's code: `yes(0.9)`, `above(0.8)` |
| When unsure | The model answers anyway; you can't see it hesitate | Low confidence → `Optional.empty()` → hand off to a human |
| Changing the rubric | Edit the prompt, pray the parser still works | Edit the question's criteria; the answer shape stays put |

The key difference is row three. In the text paradigm, "51% sure" and "99% sure" both collapse into the same "yes" inside the model, and the information is gone. The typed paradigm leaves that cut to the caller: the same `URGENT` question can use `0.6` for ticket routing and must use `0.95` for automatic refunds — **the threshold is a function of business risk, not of model capability.**

## 3. Countable Facts

| Item | Number | Source |
|---|---|---|
| Primitive question types | 3: `NOUL` / `CHOICE` / `SCORE` | `xyz.erupt.decision.constant.PrimitiveType` |
| Max CHOICE options | 255 | `DecisionConst.MAX_CHOICE_OPTIONS` |
| SCORE levels | 2 – 10 | `DecisionConst.MIN_SCORE_LEVELS` / `MAX_SCORE_LEVELS` |
| Built-in providers | 2: TypeSafe Jev (hosted), Laya (local, open weights) | `xyz.erupt.decision.core.Jev` / `Laya` |
| Wire protocol | 1 POST: `{api}/v1/systemone` | `HttpDecisionCore.PATH` |
| Auto-retried status codes | 429, 529 | `HttpDecisionCore.RETRYABLE` |
| Entry points | 3: Java API, admin-defined decisions, HTTP endpoint | `Decisions` / `DecisionDef` / `DecisionController` |
| New tables | 3: `e_ai_decision_def` / `_model` / `_question` | the module's `model/` package |

Three question types is deliberately small. Every judgement ultimately lands on one of three shapes: true/false, classification, degree. Add a fourth and every caller has to learn one more way to read an answer.

## 4. The Answer Is a Type, Not a String

`Question<A extends Answer>` uses a generic to bind the question to its answer type. Ask a `Choice<Dept>` and you get a `ChoiceAnswer<Dept>` back, whose `value()` is the enum constant — a bare `"BILLING"` string never appears in business code.

```java
package com.example.ticket;

import xyz.erupt.decision.Decision;
import xyz.erupt.decision.Decisions;
import xyz.erupt.decision.question.Choice;
import xyz.erupt.decision.question.Criteria;
import xyz.erupt.decision.question.Noul;
import xyz.erupt.decision.question.Score;

public class TicketTriage {

    enum Dept implements Criteria {
        BILLING("Invoices, refunds, payment failures"),
        TECH("Bugs, errors, integration problems"),
        SALES("Pricing, upgrades, new licenses");

        private final String criteria;

        Dept(String criteria) { this.criteria = criteria; }

        @Override
        public String criteria() { return criteria; }
    }

    // Questions are immutable values: declare once, reuse everywhere
    static final Noul URGENT = Noul.of("Does this convey urgency?");
    static final Choice<Dept> DEPT = Choice.of("Which team should handle this?", Dept.class);
    static final Score MOOD = Score.of("How frustrated is the customer?", "Calm", "Frustrated", "Very angry");

    public void triage(Ticket ticket) {
        // One round trip, one charge: the state is read once and every question answered against it
        Decision d = Decisions.of(ticket).ask(URGENT, DEPT, MOOD);
        if (d.get(URGENT).yes(0.9)) escalate(ticket);
        d.get(DEPT).above(0.8).ifPresentOrElse(dept -> route(ticket, dept), () -> queueForHuman(ticket));
        if (d.get(MOOD).value() > 1.5) notifyLead(ticket);
    }
}
```

Three design choices are worth pausing on:

1. **The return type of `d.get(DEPT)` is fixed at compile time.** `Decision` keeps an `IdentityHashMap<Question<?>, String>` recording which question object maps to which answer id, and `get(Question<A>)` returns `A` directly. You cannot read `MOOD`'s answer as a `NoulAnswer` — the compiler won't let you.
2. **`Answer` is a `sealed interface`** that only `permits NoulAnswer, ChoiceAnswer, ScoreAnswer`. A downstream `switch` over every answer type has no fourth case to miss.
3. **The enum implements `xyz.erupt.decision.question.Criteria`**, so each constant carries its own "when this applies". `Choice.of(..., Dept.class)` sends `criteria()` rather than the constant name to the model — the model reads the rule, the code reads the constant.

:::tip The counter-intuitive bit
`NoulAnswer` has no separate confidence field. In the source its `confidence()` is `Math.abs(value - 0.5) * 2`: the further from a coin flip, the surer it is. **For a yes / no question the "answer" and the "certainty" are the same number**; asking the model to report a separate confidence would only add one more place for the two to disagree.
:::

## 5. "Not Sure" Is a First-Class Citizen

The biggest problem with the text paradigm is not wrong answers — it's that **a wrong answer looks exactly like a right one**.

erupt-ai-decision makes "not sure" part of the return value. Both `ChoiceAnswer` and `ScoreAnswer` have:

```java
public Optional<T> above(double minConfidence) {
    return this.confident(minConfidence) ? Optional.of(value) : Optional.empty();
}
```

`Optional.empty()` is not an exception; it's an ordinary branch, and its meaning is "hand off to a human". A routing rule naturally splits into three: high confidence is automated, low confidence is queued, and the band in between is set by the threshold. It's the same shape as the scorecards you've written for risk control and anti-fraud for a decade — only now the score comes from a model.

`ScoreAnswer` goes one step further: it doesn't round. `value()` is a probability-weighted position, so `1.05` on a calm / frustrated / angry scale reads as "frustrated, with a little heat". Want an integer? Call `level()`. Want a label? Call `label()`. Rounding, too, is handed back to the caller.

**Admin-defined decisions** move the same type system onto data rows. `xyz.erupt.decision.model.DecisionDef` is an ordinary `@Erupt` entity whose question list is a `TAB_TABLE_ADD` sub-table; `DecisionQuestion` uses `@Dynamic` to switch editors by `type` — a key-value list for CHOICE, ordered tags for SCORE, two "means yes / means no" lines for NOUL. On save, `DecisionDefDataProxy` actually builds every row through `Question.of(type, instructions, criteria)`: invalid criteria fail the save instead of waiting for the provider to bounce them with a 422 in production.

```java
Decision d = Decisions.run("ticket_triage", ticket);
boolean refund = d.noul("refund_requested").yes(0.85);
String dept = d.choice("dept").value();   // stored definitions answer with the option key
```

Code, workflows and external services (via `POST /erupt-api/decision/{code}`) all call the same definition. Changing a rubric means an operator edits one row in the admin, not a developer shipping a release — and the provider API key never leaves the server.

## 6. How Does It Compare with Yida, Jiandaoyun, JeecgBoot and Dify?

The table compares each platform's typical approach to **"letting AI make a judgement you can branch on"**, based on their public documentation at the time of writing; check each vendor's latest release for specifics.

| Dimension | Yida / Jiandaoyun / Mingdaoyun (workflow AI nodes) | JeecgBoot (AI flow orchestration) | Dify (Question Classifier node) | Erupt (erupt-ai-decision) |
|---|---|---|---|---|
| Output shape | A text field; downstream condition nodes match on text | LLM node text / JSON output | Picks one class and follows its branch | Typed answers: probability / winner + distribution / weighted position |
| Probabilities exposed | No | No | No, only the chosen class | Yes, for every option |
| Who owns the threshold | Implicit, inside the model | Implicit, inside the model | Implicit, inside the model | The caller's code: `yes(0.9)` / `above(0.8)` |
| How "not sure" is expressed | No dedicated channel | No dedicated channel | No dedicated channel | `Optional.empty()`, an ordinary branch |
| Shape in business code | A node inside the platform, hard to call from Java | A node inside a flow | External API returning JSON | `Decisions.of(x).ask(Q)`, returns Java types |
| On-prem deployment | Depends on the platform's offering | Can plug in a local model | Can plug in a local model | Laya sidecar, Apache 2.0, ~35 ms per question on GPU |

LangChain4j's structured output (having `AiServices` return a POJO or an enum) is the closest relative — erupt-ai itself runs on LangChain4j. The difference is still rows two and three: structured output guarantees the **shape** but gives you no **distribution**; an enum return value tells you the model picked `TECH`, not that `BILLING` was only 0.02 behind.

:::info When not to use it
When you need to generate text (reply drafts, summaries, SQL), use erupt-ai's chat and agents. erupt-ai-decision answers only three kinds of question; its value is precisely that it can't do anything else.
:::

## 7. Up and Running in 5 Minutes

The module is a single dependency, and `erupt-spring-boot-starter-all` already includes it:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-decision</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

After startup, open **AI Decision → Decision Model** and create a connection: for hosted Jev, fill in the API key; to stay fully offline, start a Laya sidecar as described in the [erupt-ai-decision module docs](/en/modules/erupt-ai-decision), set the API domain to `http://127.0.0.1:8000` and leave the key blank. The **Connection Test** button sends the cheapest possible NOUL question to verify the link.

If you don't have a running Erupt project yet, start here:

**→ [Quick Start](/guide/quick-start)**

That page covers Maven dependencies, application.yml, your first @Erupt entity, the default login account, and Docker / K8S deployment.

Once it runs, paste in the `TicketTriage` class from §4 and use one of your own entities as the state — objects are handed to the model as structured JSON, which beats string concatenation on accuracy.

## 8. Next Issue

This issue was about narrowing AI output down to a value you can branch on. The same week, the main repo got a change pointing the other way: `erupt-data-http` gained `EruptHttpAdapter` lifecycle hooks and `listPath` / `totalPath` envelope unwrapping, widening any REST endpoint into an `@Erupt` table you can create, read, update and delete. Next time: **when the data isn't in your database, how much adaptation logic should an admin framework leave to you** — and why Yida's "connectors" and Mingdaoyun's "API integration" took a different road.

---

:::info Join the Discussion
Source covered in this issue: `erupt-ai/erupt-ai-decision/` (`Decisions`, `Decision`, `question/`, `answer/`, `core/DecisionCore`, `core/HttpDecisionCore`, `model/DecisionDef`, `model/DecisionQuestion`); the Laya sidecar lives in `laya/` in the same directory.

If your business already runs an "AI judgement + human fallback" flow, share how you set your thresholds on [GitHub Discussions](https://github.com/erupts/erupt/discussions) — we'd like to collect a few sets of real calibration data.
:::
