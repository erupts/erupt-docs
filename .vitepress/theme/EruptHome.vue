<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    lang: { type: String, default: 'zh' },
})

onMounted(() => document.documentElement.classList.add('eh-home'))
onUnmounted(() => document.documentElement.classList.remove('eh-home'))

const dict = {
    zh: {
        kicker: '图号 EE-01 · 开源协议 APACHE-2.0',
        subA: '开源·低代码',
        subB: 'AI 大模型',
        desc: '注解驱动的企业级后台构建引擎：写一个 Java 类，即刻获得完整的管理系统。',
        ctaMain: '快速开始',
        ctaMainLink: '/zh/guide/quick-start',
        ctaDemo: '在线体验',
        ctaDemoLink: 'https://demo.erupt.xyz',
        ctaGit: 'GitHub ↗',
        ctaGitLink: 'https://github.com/erupts/erupt',
        stats: [
            { num: '30+', label: '字段组件' },
            { num: '15+', label: 'AI 大模型' },
            { num: '2s', label: '极速启动' },
            { num: '0', label: '行前端代码' },
        ],
        figCode: '注解类 · SysUser.java',
        figUi: '生成的管理界面',
        arrowLabel: '自动生成 · ≈2s',
        stamp: '零前端代码',
        codeTitle: '用户管理',
        fUser: '用户名',
        fStatus: '状态',
        uiAdd: '+ 新增',
        uiSearch: '搜索…',
        uiCols: ['用户名', '状态', '操作'],
        tblock: [
            ['项目 PROJECT', 'ERUPT ENGINE'],
            ['协议 LICENSE', 'APACHE-2.0'],
            ['比例 SCALE', '1 : 1'],
            ['图纸 SHEET', '1 / 1'],
        ],
    },
    en: {
        kicker: 'DWG NO. EE-01 · LICENSED APACHE-2.0',
        subA: 'Annotation · Low Code',
        subB: 'AI LLM',
        desc: 'The annotation-driven admin engine: write one Java class, get a complete admin system instantly.',
        ctaMain: 'Quick Start',
        ctaMainLink: '/en/guide/quick-start',
        ctaDemo: 'Live Demo',
        ctaDemoLink: 'https://demo.erupt.xyz',
        ctaGit: 'GitHub ↗',
        ctaGitLink: 'https://github.com/erupts/erupt',
        stats: [
            { num: '30+', label: 'Field Types' },
            { num: '15+', label: 'AI Models' },
            { num: '2s', label: 'Boot Time' },
            { num: '0', label: 'Frontend Code' },
        ],
        figCode: 'Annotated class · SysUser.java',
        figUi: 'Generated admin UI',
        arrowLabel: 'AUTO-GENERATED · ≈2s',
        stamp: 'ZERO FRONTEND',
        codeTitle: 'User Mgmt',
        fUser: 'Username',
        fStatus: 'Status',
        uiAdd: '+ New',
        uiSearch: 'Search…',
        uiCols: ['Username', 'Status', 'Action'],
        tblock: [
            ['PROJECT', 'ERUPT ENGINE'],
            ['LICENSE', 'APACHE-2.0'],
            ['SCALE', '1 : 1'],
            ['SHEET', '1 / 1'],
        ],
    },
}

const t = computed(() => dict[props.lang] || dict.zh)
</script>

<template>
    <section class="eh">
        <div class="eh-bp-grid" aria-hidden="true"></div>
        <i class="eh-mark eh-mark-tl" aria-hidden="true"></i>
        <i class="eh-mark eh-mark-tr" aria-hidden="true"></i>
        <i class="eh-mark eh-mark-bl" aria-hidden="true"></i>
        <i class="eh-mark eh-mark-br" aria-hidden="true"></i>

        <div class="eh-inner">
            <div class="eh-copy">
                <p class="eh-kicker eh-reveal" style="--d:.05s">{{ t.kicker }}</p>
                <h1 class="eh-title eh-reveal" style="--d:.12s">
                    Erupt<br>Engine<span class="eh-underline" aria-hidden="true"></span>
                </h1>
                <p class="eh-sub eh-reveal" style="--d:.2s">
                    <span class="eh-sub-a">{{ t.subA }}</span>
                    <span class="eh-sub-x">×</span>
                    <span class="eh-sub-b">{{ t.subB }}</span>
                </p>
                <p class="eh-desc eh-reveal" style="--d:.28s">{{ t.desc }}</p>
                <div class="eh-ctas eh-reveal" style="--d:.36s">
                    <a class="eh-btn eh-btn-main" :href="t.ctaMainLink">{{ t.ctaMain }}</a>
                    <a class="eh-btn" :href="t.ctaDemoLink" target="_blank" rel="noreferrer">{{ t.ctaDemo }}</a>
                    <a class="eh-btn" :href="t.ctaGitLink" target="_blank" rel="noreferrer">{{ t.ctaGit }}</a>
                </div>
                <div class="eh-stats eh-reveal" style="--d:.44s">
                    <div v-for="s in t.stats" :key="s.label" class="eh-stat">
                        <b>{{ s.num }}</b>
                        <span>{{ s.label }}</span>
                    </div>
                </div>
            </div>

            <div class="eh-board eh-reveal" style="--d:.3s">
                <figure class="eh-fig eh-fig-code">
                    <figcaption>FIG.1 — {{ t.figCode }}</figcaption>
                    <pre class="eh-code"><span class="a">@Erupt</span>(name = <span class="s">"{{ t.codeTitle }}"</span>)
<span class="k">public class</span> SysUser {

    <span class="a">@EruptField</span>(
        views = <span class="a">@View</span>(title = <span class="s">"{{ t.fUser }}"</span>),
        edit  = <span class="a">@Edit</span>(title = <span class="s">"{{ t.fUser }}"</span>)
    )
    <span class="k">private</span> String username;

    <span class="a">@EruptField</span>(edit = <span class="a">@Edit</span>(title = <span class="s">"{{ t.fStatus }}"</span>))
    <span class="k">private</span> Boolean status;
}</pre>
                </figure>

                <svg class="eh-arrow" viewBox="0 0 200 120" fill="none" aria-hidden="true">
                    <path class="eh-arrow-path" d="M12 8 C 90 18, 120 62, 182 100" />
                    <path class="eh-arrow-head" d="M182 100 l-16 -2 m16 2 l-6 -15" />
                </svg>
                <span class="eh-arrow-label">{{ t.arrowLabel }}</span>

                <figure class="eh-fig eh-fig-ui">
                    <figcaption>FIG.2 — {{ t.figUi }}</figcaption>
                    <div class="eh-ui">
                        <div class="eh-ui-bar">
                            <span class="eh-ui-title">{{ t.codeTitle }}</span>
                            <span class="eh-ui-btn eh-ui-btn-acc">{{ t.uiAdd }}</span>
                            <span class="eh-ui-btn">{{ t.uiSearch }}</span>
                        </div>
                        <div class="eh-ui-row eh-ui-head">
                            <i class="eh-ui-cb"></i>
                            <span v-for="c in t.uiCols" :key="c">{{ c }}</span>
                        </div>
                        <div v-for="i in 3" :key="i" class="eh-ui-row">
                            <i class="eh-ui-cb"></i>
                            <span><i class="eh-ui-line" :style="{ width: (72 - i * 12) + '%' }"></i></span>
                            <span><i class="eh-ui-dot" :class="{ off: i === 3 }"></i><i class="eh-ui-line" style="width:40%"></i></span>
                            <span><i class="eh-ui-line" style="width:55%"></i></span>
                        </div>
                    </div>
                    <span class="eh-stamp">{{ t.stamp }}</span>
                </figure>
            </div>
        </div>

        <footer class="eh-tblock">
            <div v-for="c in t.tblock" :key="c[0]" class="eh-tblock-cell">
                <span>{{ c[0] }}</span>
                <b>{{ c[1] }}</b>
            </div>
            <div class="eh-tblock-cell eh-tblock-logo">
                <b>erupt<i>.</i></b>
            </div>
        </footer>
    </section>
</template>

<style>
.eh-home {
    --eh-paper: #f4f7fc;
    --ink: #2b5cad;
    --ink-soft: rgba(43, 92, 173, .45);
    --line-minor: rgba(43, 92, 173, .09);
    --line-major: rgba(43, 92, 173, .18);
    --txt: #101f38;
    --txt2: #52688a;
    --card: rgba(255, 255, 255, .72);
    --acc: #ff5722;
    background: var(--eh-paper);
}

.eh-home.dark {
    --eh-paper: #0c1e33;
    --ink: #8fb8ff;
    --ink-soft: rgba(143, 184, 255, .5);
    --line-minor: rgba(143, 184, 255, .07);
    --line-major: rgba(143, 184, 255, .16);
    --txt: #e8f0fd;
    --txt2: #90a6c8;
    --card: rgba(10, 30, 55, .6);
    --acc: #ff6a3c;
}

.eh-home body {
    background: transparent;
}

.eh-home .VPNav,
.eh-home .VPNavBar {
    background: transparent !important;
}

.eh-home .VPNavBar .divider {
    display: none !important;
}

.eh-home .VPFooter {
    display: none !important;
}

.eh-home .VPContent,
.eh-home .VPPage {
    padding: 0 !important;
}
</style>

<style scoped>
.eh {
    --mono: "Courier New", Menlo, Monaco, Consolas, monospace;
    position: relative;
    min-height: 100vh;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--eh-paper, #f4f7fc);
    color: var(--txt);
    overflow: hidden;
    padding: calc(var(--vp-nav-height) + 12px) 40px 0;
}

/* ---- blueprint grid ---- */
.eh-bp-grid {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(var(--line-minor) 1px, transparent 1px),
        linear-gradient(90deg, var(--line-minor) 1px, transparent 1px),
        linear-gradient(var(--line-major) 1px, transparent 1px),
        linear-gradient(90deg, var(--line-major) 1px, transparent 1px);
    background-size: 20px 20px, 20px 20px, 100px 100px, 100px 100px;
    pointer-events: none;
}

/* ---- corner registration marks ---- */
.eh-mark {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 0 solid var(--ink-soft);
    pointer-events: none;
}

.eh-mark-tl { top: calc(var(--vp-nav-height) + 16px); left: 20px; border-top-width: 1.5px; border-left-width: 1.5px; }
.eh-mark-tr { top: calc(var(--vp-nav-height) + 16px); right: 20px; border-top-width: 1.5px; border-right-width: 1.5px; }
.eh-mark-bl { bottom: 76px; left: 20px; border-bottom-width: 1.5px; border-left-width: 1.5px; }
.eh-mark-br { bottom: 76px; right: 20px; border-bottom-width: 1.5px; border-right-width: 1.5px; }

/* ---- layout ---- */
.eh-inner {
    position: relative;
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 56px;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 0 28px;
}

/* ---- copy ---- */
.eh-kicker {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: .18em;
    color: var(--txt2);
    margin: 0 0 18px;
}

.eh-title {
    position: relative;
    font-family: var(--mono);
    font-weight: 700;
    font-size: clamp(52px, 5.6vw, 78px);
    line-height: 1.02;
    letter-spacing: -.02em;
    color: var(--txt);
    margin: 0 0 18px;
}

.eh-underline {
    display: block;
    width: 168px;
    height: 7px;
    margin-top: 14px;
    background: var(--acc);
    transform: rotate(-.6deg);
}

.eh-sub {
    font-family: var(--mono);
    font-size: clamp(17px, 1.6vw, 21px);
    font-weight: 700;
    margin: 0 0 14px;
    color: var(--txt);
}

.eh-sub-a { color: var(--acc); }
.eh-sub-x { margin: 0 10px; opacity: .35; font-weight: 400; }

.eh-desc {
    font-size: 15px;
    line-height: 1.75;
    color: var(--txt2);
    max-width: 430px;
    margin: 0 0 26px;
}

/* ---- buttons ---- */
.eh-ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 34px;
}

.eh-btn {
    font-family: var(--mono);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: .04em;
    text-decoration: none;
    color: var(--txt);
    border: 1.5px solid var(--ink);
    padding: 10px 24px;
    background: var(--card);
    transition: transform .18s ease, box-shadow .18s ease;
}

.eh-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 3px 3px 0 var(--ink-soft);
}

.eh-btn-main {
    background: var(--acc);
    border-color: var(--acc);
    color: #fff;
    box-shadow: 4px 4px 0 var(--ink);
}

.eh-btn-main:hover {
    box-shadow: 6px 6px 0 var(--ink);
}

/* ---- dimension stats ---- */
.eh-stats {
    position: relative;
    display: flex;
    max-width: 460px;
    border-top: 1.5px solid var(--ink-soft);
    padding-top: 12px;
}

.eh-stats::after {
    content: '';
    position: absolute;
    top: -1px;
    right: 0;
    width: 1.5px;
    height: 9px;
    background: var(--ink-soft);
}

.eh-stat {
    position: relative;
    flex: 1;
}

.eh-stat::before {
    content: '';
    position: absolute;
    top: -13px;
    left: 0;
    width: 1.5px;
    height: 9px;
    background: var(--ink-soft);
}

.eh-stat b {
    display: block;
    font-family: var(--mono);
    font-size: 22px;
    color: var(--txt);
}

.eh-stat b { color: var(--acc); }

.eh-stat span {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--txt2);
    letter-spacing: .05em;
}

/* ---- drawing board ---- */
.eh-board {
    position: relative;
}

.eh-fig {
    position: relative;
    margin: 0;
    border: 1.5px solid var(--ink);
    background: var(--card);
    backdrop-filter: blur(2px);
}

.eh-fig figcaption {
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: .12em;
    color: var(--txt2);
    border-bottom: 1px dashed var(--ink-soft);
    padding: 8px 14px;
}

.eh-fig-code {
    width: 66%;
    z-index: 2;
}

.eh-fig-ui {
    width: 62%;
    margin-left: auto;
    margin-top: -44px;
    z-index: 1;
}

.eh-code {
    margin: 0;
    padding: 14px 16px;
    font-family: var(--mono);
    font-size: 12px;
    line-height: 1.6;
    color: var(--txt);
    overflow: hidden;
    white-space: pre;
}

.eh-code .a { color: var(--acc); font-weight: 700; }
.eh-code .k { color: var(--ink); font-weight: 700; }
.eh-code .s { color: var(--txt2); font-style: italic; }

/* ---- arrow ---- */
.eh-arrow {
    position: absolute;
    left: 26%;
    top: 46%;
    width: 34%;
    height: 24%;
    z-index: 3;
    pointer-events: none;
    overflow: visible;
}

.eh-arrow-path,
.eh-arrow-head {
    stroke: var(--acc);
    stroke-width: 2;
    stroke-linecap: round;
}

.eh-arrow-path {
    stroke-dasharray: 7 6;
    animation: eh-dash 5s linear infinite;
}

@keyframes eh-dash {
    to { stroke-dashoffset: -130; }
}

.eh-arrow-label {
    position: absolute;
    left: 18%;
    top: 60%;
    z-index: 3;
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--acc);
    background: var(--eh-paper, #f4f7fc);
    border: 1px dashed var(--acc);
    padding: 3px 10px;
    transform: rotate(-2deg);
}

/* ---- ui wireframe ---- */
.eh-ui {
    padding: 12px 14px 16px;
}

.eh-ui-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
}

.eh-ui-title {
    font-family: var(--mono);
    font-size: 13px;
    font-weight: 700;
    color: var(--txt);
    margin-right: auto;
}

.eh-ui-btn {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--txt2);
    border: 1px solid var(--ink-soft);
    padding: 3px 10px;
}

.eh-ui-btn-acc {
    color: var(--acc);
    border-color: var(--acc);
}

.eh-ui-row {
    display: grid;
    grid-template-columns: 24px 1.2fr 1fr 1fr;
    align-items: center;
    gap: 8px;
    padding: 8px 2px;
    border-top: 1px solid var(--line-major);
}

.eh-ui-head {
    border-top: 1.5px solid var(--ink-soft);
    font-family: var(--mono);
    font-size: 10.5px;
    letter-spacing: .06em;
    color: var(--txt2);
}

.eh-ui-cb {
    width: 10px;
    height: 10px;
    border: 1.5px solid var(--ink-soft);
}

.eh-ui-line {
    display: inline-block;
    height: 6px;
    background: var(--ink-soft);
    opacity: .55;
    vertical-align: middle;
}

.eh-ui-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #22c55e;
    margin-right: 6px;
    vertical-align: middle;
}

.eh-ui-dot.off { background: var(--ink-soft); }

/* ---- stamp ---- */
.eh-stamp {
    position: absolute;
    right: -14px;
    top: -16px;
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .14em;
    color: var(--acc);
    border: 3px double var(--acc);
    padding: 6px 14px;
    transform: rotate(8deg);
    background: transparent;
    opacity: .9;
}

/* ---- title block (engineering drawing footer) ---- */
.eh-tblock {
    position: relative;
    display: flex;
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    border: 1.5px solid var(--ink);
    border-bottom: 0;
    background: var(--card);
}

.eh-tblock-cell {
    flex: 1;
    padding: 9px 18px;
    border-right: 1px solid var(--ink-soft);
    font-family: var(--mono);
}

.eh-tblock-cell span {
    display: block;
    font-size: 9.5px;
    letter-spacing: .14em;
    color: var(--txt2);
}

.eh-tblock-cell b {
    font-size: 13px;
    color: var(--txt);
    letter-spacing: .06em;
}

.eh-tblock-logo {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    border-right: 0;
}

.eh-tblock-logo b {
    font-size: 18px;
    font-weight: 700;
}

.eh-tblock-logo i {
    color: var(--acc);
    font-style: normal;
}

/* ---- reveal animation ---- */
.eh-reveal {
    opacity: 0;
    transform: translateY(14px);
    animation: eh-in .7s cubic-bezier(.2, .7, .3, 1) forwards;
    animation-delay: var(--d, 0s);
}

@keyframes eh-in {
    to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
    .eh-reveal { animation: none; opacity: 1; transform: none; }
    .eh-arrow-path { animation: none; }
}

/* ---- responsive ---- */
@media (max-width: 960px) {
    .eh { padding: calc(var(--vp-nav-height) + 8px) 20px 0; min-height: auto; }
    .eh-inner { grid-template-columns: 1fr; gap: 40px; padding-bottom: 40px; }
    .eh-mark { display: none; }
    .eh-fig-code { width: 78%; }
    .eh-fig-ui { width: 74%; margin-top: -32px; }
    .eh-tblock { flex-wrap: wrap; }
    .eh-tblock-cell { flex: 1 1 40%; border-top: 1px solid var(--ink-soft); }
}

@media (max-width: 560px) {
    .eh-title { font-size: clamp(40px, 12vw, 52px); }
    .eh-fig-code, .eh-fig-ui { width: 100%; margin-top: 0; }
    .eh-fig-ui { margin-top: 16px; }
    .eh-arrow, .eh-arrow-label { display: none; }
    .eh-stamp { right: 4px; }
}
</style>
