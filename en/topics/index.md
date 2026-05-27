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
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.topic-mp-qr img {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.topic-mp-qr__body { flex: 1; min-width: 0; }
.topic-mp-qr__tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  margin-bottom: 6px;
}
.topic-mp-qr__title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}
.topic-mp-qr__desc {
  margin: 0 0 8px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}
.topic-mp-qr__hint {
  font-size: 12px;
  color: var(--vp-c-text-3);
}
@media (max-width: 640px) {
  .topic-mp-qr { flex-direction: column; text-align: center; }
  .topic-mp-qr img { width: 140px; height: 140px; }
}

.topic-list__heading {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--vp-c-text-3);
  border: none !important;
  padding: 0 !important;
  margin: 8px 0 16px !important;
}

.topic-list {
  margin: 32px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.topic-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  text-decoration: none !important;
  color: inherit;
  transition: border-color .15s, transform .15s, box-shadow .15s;
}
.topic-card:hover {
  border-color: var(--vp-c-brand-1);
  transform: translateY(-1px);
  box-shadow: 0 6px 24px rgba(100,108,255,.08);
}
.topic-card__index {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  color: var(--vp-c-brand-1);
  letter-spacing: -1px;
  min-width: 64px;
}
.topic-card__body { flex: 1; }
.topic-card__tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  margin-bottom: 8px;
}
.topic-card__title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
}
.topic-card__desc {
  margin: 0 0 12px;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1.6;
}
.topic-card__meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.topic-card__meta a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
</style>
