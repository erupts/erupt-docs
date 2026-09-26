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

<a class="topic-card" href="/topics/generator-reads-database">
  <div class="topic-card__index">#14</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Generator</div>
    <h3 class="topic-card__title">从数据库反向生成模型</h3>
    <p class="topic-card__desc">第 05 期我们说 Erupt 没有"生成"这个动词。现在 erupt-generator 能反读一个存量数据库，把列注释里的"0-待支付 1-已支付"读成 @ChoiceType、把外键约束读成按真实列标注的引用。两者不矛盾：若依、JeecgBoot 一张表生成一套分层，Erupt 一张表只生成一个 @Erupt 类，不写源码目录、不留运行时痕迹——生成一次，然后退场。</p>
    <div class="topic-card__meta">
      <span>2026-09-23</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/identity-without-security-stack">
  <div class="topic-card__index">#13</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Identity</div>
    <h3 class="topic-card__title">不依赖 Spring Security 的登录链</h3>
    <p class="topic-card__desc">接 SSO 的常规路径是引 spring-security-oauth2-client、写 SecurityFilterChain、再挑一个 JWT 库。Erupt 一个都没引——不是造轮子的偏好，而是登录链一旦拆进 Filter 与外部 starter，"这个账号能不能进来"就再也不是一份判断。这一期讲那条自己走完的七关登录链：SSO Provider 是一张 @Erupt 表不是 yaml、从不读 id_token、token 不进 URL、锁定键是 account+IP 而不是 account。</p>
    <div class="topic-card__meta">
      <span>2026-09-21</span>
      <span>·</span>
      <span>11 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/remote-sftp-boundary">
  <div class="topic-card__index">#12</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Remote Access</div>
    <h3 class="topic-card__title">远程主机的安全边界</h3>
    <p class="topic-card__desc">浏览器里开一个 SSH 终端，国内只有两条成熟的路——上 JumpServer 这类堡垒机，另起一套账号体系与审计；或者装 1Panel / 宝塔，装上即 root、边界基本不存在。Erupt 押第三条：远程主机就是一个普通的 @Erupt 模型，走同一套菜单权限、同一套 DataProxy、同一套行过滤，不新增账号表也不新增常驻进程。代价是安全边界要一条条自己画——这一期把那几条线逐条摊开，包括两个明确"不做"。</p>
    <div class="topic-card__meta">
      <span>2026-09-18</span>
      <span>·</span>
      <span>11 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/record-comment-crosscut">
  <div class="topic-card__index">#11</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Record Comment</div>
    <h3 class="topic-card__title">记录评论为什么不绑定业务表</h3>
    <p class="topic-card__desc">所有做后台的人都给某张表加过 remark 字段，然后加 remark_user、remark_time，然后建一张 xxx_comment 子表——下一个实体来了再来一遍。宜搭把评论挂在流程节点上，简道云挂在表单上。Erupt 押反向：一张表不认识任何业务实体，靠 (模型名, 主键字符串) 寻址；而在多节点部署里，记录在节点、评论在中心——这逼出了 @EruptRouter 的 cloudProxy 开关。</p>
    <div class="topic-card__meta">
      <span>2026-09-17</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/cell-edit-whole-row">
  <div class="topic-card__index">#10</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Cell Edit</div>
    <h3 class="topic-card__title">单元格编辑为什么走整行管线</h3>
    <p class="topic-card__desc">后台表格集体向多维表格靠拢，双击就地改一个字段。体验好，但它在服务端开了一条只带一个字段的写入路径——跨字段规则跑不了、DataProxy 拿到残缺实体、只读形同虚设、afterFetch 的回显值会被写回。Erupt 押反向：单元格编辑不配拥有自己的路径，把整行捞出来打补丁，再原样走一遍编辑管线。七道关全在服务端。</p>
    <div class="topic-card__meta">
      <span>2026-09-16</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/model-atlas-audit">
  <div class="topic-card__index">#09</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Model Atlas</div>
    <h3 class="topic-card__title">模型图谱与静态审计</h3>
    <p class="topic-card__desc">低代码平台画模型关系图，通常是为了"看起来专业"。erupt-atlas 押反向——图只是副产品，真正的输出是对运行时注册表的一次静态审计：循环依赖（Tarjan SCC）、共享物理表、孤儿模型、建了没挂菜单的模型、声明了权限却没长出按钮。三个 REST 端点返回结构化 JSON，能被人看，也能被 CI 断言。</p>
    <div class="topic-card__meta">
      <span>2026-09-15</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/annotation-language-injection">
  <div class="topic-card__index">#08</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Annotation DX</div>
    <h3 class="topic-card__title">注解里写的不是字符串，是有语法的代码</h3>
    <p class="topic-card__desc">画布党最爱的反驳是"注解就是把 SQL 写成没高亮的哑字符串"。Erupt 押反向——用 JetBrains @Language 往自己的注解属性里注入 10 种嵌入式语言（hql/sql/VTL/markdown/java…），一行 sql="..." 在 IntelliJ 里有高亮、补全、报错；@Comment 再让同一个属性对人和 AI 都自描述。</p>
    <div class="topic-card__meta">
      <span>2026-07-01</span>
      <span>·</span>
      <span>9 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/bytecode-designer">
  <div class="topic-card__index">#07</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Runtime Designer</div>
    <h3 class="topic-card__title">ByteBuddy × JsonAnnotationProxy × @EruptDataProcessor：我们做了设计器，但它编译成一个真 @Erupt 类</h3>
    <p class="topic-card__desc">在线表单设计器几乎都把设计稿存成一份 JSON DSL，运行时靠解释器渲染。erupt-designer 押反向：设计稿在运行时被 ByteBuddy 编译成一个真正的 @Erupt 类，复用与手写实体完全相同的管线——Gson、反射、校验、DataProxy、@EruptFlow，无重启、无生成代码、无解释器。</p>
    <div class="topic-card__meta">
      <span>2026-06-17</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

<a class="topic-card" href="/topics/security-defaults">
  <div class="topic-card__index">#06</div>
  <div class="topic-card__body">
    <div class="topic-card__tag">Secure by Default</div>
    <h3 class="topic-card__title">@Power × SHA512+Salt × PowerHandler：低代码的"安全"不该是上线前才补的那一栏</h3>
    <p class="topic-card__desc">国内后台框架的安全是"配齐再上线"——RBAC、按钮权限、密码加密都是清单上的待办项。Erupt 押反向：安全是注解默认值。@Power 的 export/importable 默认 false，PowerHandler 在运行时收口，密码 MD5→SHA-512+盐 在改密时自动平滑迁移，无停机、无 rehash 脚本。</p>
    <div class="topic-card__meta">
      <span>2026-06-10</span>
      <span>·</span>
      <span>10 min read</span>
    </div>
  </div>
</a>

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
