---
title: Topics
description: Erupt's "Topics" column — each issue takes a single core topic and weaves capabilities scattered across the source code, annotations, and modules into a readable, hands-on, competitor-comparable narrative.
outline: deep
---

# Topics

> Each issue takes a single core topic and weaves Erupt's capabilities — scattered across source code, annotations, and modules — into **a readable, hands-on, competitor-comparable** narrative.
>
> Cadence: roughly one issue per month.

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies. Reply "<b>加群</b>" to join the user group, or "<b>入门</b>" for a 5-minute getting-started guide.</p>
    <div class="topic-mp-qr__hint">📚 Scroll down for published topics → Archive</div>
  </div>
</div>

<h2 class="topic-list__heading">Archive</h2>

<div class="topic-list">

<a class="topic-card" href="/en/topics/annotation-language-injection">
  <div class="topic-card__index">#08</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Annotation DX</div>
    <h3 class="topic-card__title">What you write in an annotation isn't a string — it's code with syntax</h3>
    <p class="topic-card__desc">The favorite rebuttal against annotation-based low-code is "annotations just turn SQL into unhighlighted dumb strings." Erupt bets the reverse — it uses JetBrains @Language to inject 10 embedded languages (hql/sql/VTL/markdown/java…) into its own annotation attributes, so a single sql="..." gets highlighting, completion, and error checking in IntelliJ; @Comment then makes the same attribute self-describing for both humans and AI.</p>
    <div class="topic-card__meta">
      <span>2026-07-01</span>
      <span>·</span>
      <span>9 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/bytecode-designer">
  <div class="topic-card__index">#07</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Runtime Designer</div>
    <h3 class="topic-card__title">ByteBuddy × JsonAnnotationProxy × @EruptDataProcessor: We built a designer, but it compiles into a real @Erupt class</h3>
    <p class="topic-card__desc">Nearly every online form designer stores the design as a JSON DSL and renders it at runtime through an interpreter. erupt-designer bets the opposite way — at runtime the design is compiled by ByteBuddy into a real @Erupt class, reusing the exact same pipeline as a hand-written entity: Gson, reflection, validation, DataProxy, @EruptFlow. No restart, no generated code, no interpreter.</p>
    <div class="topic-card__meta">
      <span>2026-06-17</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/security-defaults">
  <div class="topic-card__index">#06</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Secure by Default</div>
    <h3 class="topic-card__title">@Power × SHA512+Salt × PowerHandler: in low-code, "security" shouldn't be the column you fill in right before launch</h3>
    <p class="topic-card__desc">For most domestic admin frameworks, security is a "configure it before launch" checklist — RBAC, button permissions, password encryption are all to-do items. Erupt bets the reverse: security is the default value of an annotation. @Power defaults export/importable to false, PowerHandler enforces at runtime, and passwords migrate from MD5 to SHA-512+Salt automatically on the next change — no downtime, no rehash script.</p>
    <div class="topic-card__meta">
      <span>2026-06-10</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/controllable-low-code">
  <div class="topic-card__index">#05</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Design Philosophy</div>
    <h3 class="topic-card__title">Annotation × Spring × Git: the most controllable low-code platform — no verb called "generate"</h3>
    <p class="topic-card__desc">Chinese low-code = drag-and-drop canvases or on-platform Node.js editors, all built for business operators. Erupt bets on the opposite lane — low-code for backend engineers: annotations are the config, extension points are Spring beans, the source of truth lives in Git, and the framework writes zero bytes into your source tree. 17 LLMs + A2A + memory + @AiToolbox ship as default dependencies, not AI add-ons.</p>
    <div class="topic-card__meta">
      <span>2026-06-01</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/cube-llm">
  <div class="topic-card__index">#04</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Cube × LLM</div>
    <h3 class="topic-card__title">Let the BI dashboard answer "why did it change" — the new shape of Erupt Cube × LLM</h3>
    <p class="topic-card__desc">Traditional BI tools give you the "what"; Erupt Cube × LLM gives you the "why". The @EruptCube annotation defines a semantic layer, and the LLM grows three eyes alongside the domain model (cubeList → cubeMetadata → cubeQuery): it writes the SQL, renders the chart, and produces the attribution. This issue stitches together the AI Harness from #01 and the "annotation-first" narrative from #03.</p>
    <div class="topic-card__meta">
      <span>2026-05-28</span>
      <span>·</span>
      <span>11 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/jpa-superset">
  <div class="topic-card__index">#03</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">AI × Flow × Cloud</div>
    <h3 class="topic-card__title">While MyBatis-Plus still battles SQL DSLs, Erupt wraps a whole admin infrastructure around JPA</h3>
    <p class="topic-card__desc">In Erupt, a single @Entity grows ten identities — UI, RBAC, REST API, auto DDL, i18n, DataProxy, lambda queries, AI Agent, workflow engine, cross-service aggregation. The annotation is the config surface; metadata = UI = API = LLM Tool.</p>
    <div class="topic-card__meta">
      <span>2026-05-25</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/annotation-vs-canvas">
  <div class="topic-card__index">#02</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Design Philosophy</div>
    <h3 class="topic-card__title">@Erupt × DataProxy × Handler: why we did not go with a drag-and-drop canvas</h3>
    <p class="topic-card__desc">While DingTalk Yida, Jiandao Cloud, and JeecgBoot all bet on "canvas" or "canvas-generates-code", Erupt still bets on the source code itself — a single @Erupt annotation, a DataProxy&lt;T&gt; extension point, and a set of Handler interfaces. This issue explains why.</p>
    <div class="topic-card__meta">
      <span>2026-05-22</span>
      <span>·</span>
      <span>9 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/en/topics/50-llm-a2a-memory">
  <div class="topic-card__index">#01</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">AI Harness</div>
    <h3 class="topic-card__title">50+ LLMs × A2A × Memory: how Erupt's AI Harness came to life</h3>
    <p class="topic-card__desc">17 providers, the A2A cross-agent protocol, cross-session Memory, plus a Tool / MCP call you can wire up with a single Java annotation — why we believe a Java backend shouldn't be locked into the "AI app generator" narrative of products like ToolJet.</p>
    <div class="topic-card__meta">
      <span>2026-05-22</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

</div>

:::tip Want to submit a topic?
A topic is not a changelog or a module manual — it tells the story of **how a single idea takes shape inside Erupt**.
If your Erupt journey carved out a unique path, propose it on [GitHub Discussions](https://github.com/erupts/erupt/discussions); accepted ideas will be published as a Topic.
:::

<style>
.topic-mp-qr {
  display: flex;
  gap: 20px;
  align-items: center;
  margin: 24px 0 40px;
  padding: 20px 24px;
  border: 2px solid #14120B;
  background: #FFF9EE;
  box-shadow: 5px 5px 0 #14120B;
}
.dark .topic-mp-qr {
  border-color: #F0E8D6;
  background: #201C12;
  box-shadow: 5px 5px 0 #F0E8D6;
}
.topic-mp-qr img {
  width: 120px;
  height: 120px;
  border: 1.5px solid #14120B;
  object-fit: cover;
  flex-shrink: 0;
}
.topic-mp-qr__body { flex: 1; min-width: 0; }
.topic-mp-qr__tag {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .05em;
  padding: 2px 8px;
  background: #4FC8EC;
  color: #14120B;
  border: 1.5px solid #14120B;
  margin-bottom: 8px;
}
.topic-mp-qr__title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 6px;
}
.topic-mp-qr__desc {
  margin: 0 0 8px;
  color: #5C5647;
  font-size: 14px;
  line-height: 1.6;
}
.dark .topic-mp-qr__desc { color: #B0A78F; }
.topic-mp-qr__hint {
  font-size: 12px;
  color: rgba(20, 18, 11, .5);
}
.dark .topic-mp-qr__hint { color: rgba(240, 232, 214, .5); }
@media (max-width: 640px) {
  .topic-mp-qr { flex-direction: column; text-align: center; }
  .topic-mp-qr img { width: 140px; height: 140px; }
}

.topic-list__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none !important;
  padding: 0 !important;
  margin: 8px 0 16px !important;
}
.topic-list__heading::before {
  content: '';
  width: 8px;
  height: 8px;
  background: #4FC8EC;
  border: 1.5px solid #14120B;
  flex-shrink: 0;
}

.topic-list {
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.topic-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  border: 2px solid #14120B;
  background: #FFFFFF;
  text-decoration: none !important;
  color: inherit;
  transition: transform .15s, box-shadow .15s;
}
.dark .topic-card {
  border-color: #F0E8D6;
  background: #201C12;
}
.topic-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 #14120B;
}
.dark .topic-card:hover {
  box-shadow: 6px 6px 0 #F0E8D6;
}
.topic-card__index {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
  color: rgba(20, 18, 11, .18);
  letter-spacing: -1px;
  min-width: 64px;
}
.dark .topic-card__index { color: rgba(240, 232, 214, .22); }
.topic-card__body { flex: 1; }
.topic-card__tag {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .05em;
  padding: 2px 8px;
  background: #4FC8EC;
  color: #14120B;
  border: 1.5px solid #14120B;
  margin-bottom: 8px;
}
.topic-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.4;
  color: var(--vp-c-text-1);
}
.topic-card__desc {
  margin: 0 0 12px;
  color: #5C5647;
  font-size: 14px;
  line-height: 1.6;
}
.dark .topic-card__desc { color: #B0A78F; }
.topic-card__meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: rgba(20, 18, 11, .5);
}
.dark .topic-card__meta { color: rgba(240, 232, 214, .5); }
.topic-card__meta a {
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  text-decoration-color: #4FC8EC;
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
</style>
