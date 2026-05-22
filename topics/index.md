---
title: 专题
description: Erupt 的专题栏目 —— 以一个核心话题为线索，把分散在源码、注解、模块里的能力串成一条可读、可上手、可对位竞品的叙事。
outline: deep
---

# 专题 · Topics

> 每一期专题以一个核心话题为线索，把零散在源码、注解、模块里的 Erupt 能力，串成**一条可读、可上手、可对位竞品**的叙事。
>
> 节奏：约每月一期。

<div class="topic-list">

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
