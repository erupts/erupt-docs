---
title: 专题
description: Erupt 的专题栏目 —— 以一个核心话题为线索，把分散在源码、注解、模块里的能力串成一条可读、可上手、可对位竞品的叙事。
outline: deep
---

# 专题 · Topics

> 每一期专题以一个核心话题为线索，把零散在源码、注解、模块里的 Erupt 能力，串成**一条可读、可上手、可对位竞品**的叙事。
>
> 节奏：约每月一期。

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。回复「<b>加群</b>」加入用户群，回复「<b>入门</b>」获取 5 分钟上手指南。</p>
    <div class="topic-mp-qr__hint">📚 已发布专题向下滑动 → 查看历史文章</div>
  </div>
</div>

<h2 class="topic-list__heading">历史文章 · Archive</h2>

<div class="topic-list">

<a class="topic-card" href="/topics/controllable-low-code">
  <div class="topic-card__index">#05</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Design Philosophy</div>
    <h3 class="topic-card__title">注解 × Spring × Git：史上最可控的低代码——没有"生成"这个动词</h3>
    <p class="topic-card__desc">国内低代码 = 拖拽画布 / Node.js 在线脚本，给业务运营用。Erupt 押的是反向那条路——做给后端工程师的低代码：注解就是配置，扩展点都是 Spring Bean，真理在 Git 里，框架不向你源码目录写一个字节；17 个 LLM + A2A + Memory + @AiToolbox 是默认依赖，不是 AI 加件。</p>
    <div class="topic-card__meta">
      <span>2026-06-01</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/cube-llm">
  <div class="topic-card__index">#04</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Cube × LLM</div>
    <h3 class="topic-card__title">让 BI 看板自己回答"为什么变了"——Erupt Cube × LLM 的新姿势</h3>
    <p class="topic-card__desc">传统 BI 给你"是什么"，Erupt Cube × LLM 给你"为什么"。@EruptCube 注解定义语义层，LLM 在领域模型旁边长出三只眼睛（cubeList → cubeMetadata → cubeQuery），自己写 SQL、出图、写归因。这一期把第 01 期的 AI Harness 和第 03 期的"注解派"缝到一起。</p>
    <div class="topic-card__meta">
      <span>2026-05-28</span>
      <span>·</span>
      <span>11 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/jpa-superset">
  <div class="topic-card__index">#03</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">AI × Flow × Cloud</div>
    <h3 class="topic-card__title">当 MyBatis-Plus 还在卷 SQL DSL，Erupt 给 JPA 加了一整圈后台基础设施</h3>
    <p class="topic-card__desc">一个 @Entity，在 Erupt 里能长出 10 种身份——UI、RBAC、REST API、Auto DDL、i18n、DataProxy、Lambda 查询、AI Agent、流程引擎、跨服务聚合。注解就是配置面，元数据 = UI = API = LLM Tool。</p>
    <div class="topic-card__meta">
      <span>2026-05-25</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/annotation-vs-canvas">
  <div class="topic-card__index">#02</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Design Philosophy</div>
    <h3 class="topic-card__title">@Erupt × DataProxy × Handler：为什么我们没去做拖拽画布</h3>
    <p class="topic-card__desc">当钉钉宜搭、简道云、JeecgBoot 全部押注"画布"或"画布生成代码"，Erupt 仍然押注源代码本身——一行 @Erupt 注解、一个 DataProxy&lt;T&gt; 扩展点、一组 Handler 接口。这一期讲清楚为什么。</p>
    <div class="topic-card__meta">
      <span>2026-05-22</span>
      <span>·</span>
      <span>9 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/50-llm-a2a-memory">
  <div class="topic-card__index">#01</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">AI Harness</div>
    <h3 class="topic-card__title">50+ LLM × A2A × Memory：Erupt 的 AI Harness 是怎么长出来的</h3>
    <p class="topic-card__desc">17 个 provider、A2A 跨 Agent 协议、跨会话 Memory，外加一个 Java 注解就能挂上去的 Tool / MCP 调用——为什么我们认为 Java 后台不该被 ToolJet 那种"AI App Generator"叙事垄断。</p>
    <div class="topic-card__meta">
      <span>2026-05-22</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

</div>

:::tip 想投稿专题？
专题不是发版日志，也不是模块手册——它讲的是**一个想法在 Erupt 里如何落地**。
如果你在使用 Erupt 时踩出过一条独特路径，欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 提案，被采纳的话我们会以专题形式出版。
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
