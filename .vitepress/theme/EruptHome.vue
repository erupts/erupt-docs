<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    lang: { type: String, default: 'zh' },
})

onMounted(() => document.documentElement.classList.add('eh-home'))
onUnmounted(() => document.documentElement.classList.remove('eh-home'))

const dict = {
    zh: {
        kicker: '开源 · Apache-2.0 · 注解驱动',
        titleL1: '一个 Java 类，',
        titleL2: '一套完整的',
        titleHl: '管理系统。',
        desc: '注解驱动的开源低代码引擎。零前端代码、零 CRUD 模板，内置 AI 大模型深度集成。为 Java 工程师打造。',
        ctaMain: '快速上手 →',
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
        winCode: 'SysUser.java',
        winUi: '用户管理 · 自动生成',
        arrowChip: '自动生成 ≈2s',
        codeTitle: '用户管理',
        fUser: '用户名',
        fStatus: '状态',
        uiAdd: '+ 新增',
        uiSearch: '搜索…',
        uiCols: ['用户名', '状态', '操作'],
    },
    en: {
        kicker: 'OPEN SOURCE · APACHE-2.0 · ANNOTATION-DRIVEN',
        titleL1: 'One Java class.',
        titleL2: 'One complete',
        titleHl: 'admin system.',
        desc: 'The annotation-driven open-source low-code engine. Zero frontend code, zero CRUD boilerplate, with deep AI / LLM integration. Built for Java engineers.',
        ctaMain: 'Quick Start →',
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
        winCode: 'SysUser.java',
        winUi: 'User Mgmt · Auto-generated',
        arrowChip: 'AUTO-GEN ≈2s',
        codeTitle: 'User Mgmt',
        fUser: 'Username',
        fStatus: 'Status',
        uiAdd: '+ New',
        uiSearch: 'Search…',
        uiCols: ['Username', 'Status', 'Action'],
    },
}

const techItems = ['JDK 17+', 'Spring Boot 3.x', 'MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'H2', 'MongoDB', 'Apache-2.0']

const t = computed(() => dict[props.lang] || dict.zh)
</script>

<template>
    <div class="rf">
        <section class="rf-hero">
            <div class="rf-hero-inner">
                <div class="rf-copy">
                    <p class="rf-kicker rf-pop" style="--d:.05s">{{ t.kicker }}</p>
                    <h1 class="rf-title rf-pop" style="--d:.12s">
                        {{ t.titleL1 }}<br>
                        {{ t.titleL2 }}<br>
                        <mark class="rf-hl">{{ t.titleHl }}</mark>
                    </h1>
                    <p class="rf-desc rf-pop" style="--d:.22s">{{ t.desc }}</p>
                    <div class="rf-ctas rf-pop" style="--d:.3s">
                        <a class="rf-btn rf-btn-main" :href="t.ctaMainLink">{{ t.ctaMain }}</a>
                        <a class="rf-btn" :href="t.ctaDemoLink" target="_blank" rel="noreferrer">{{ t.ctaDemo }}</a>
                        <a class="rf-btn" :href="t.ctaGitLink" target="_blank" rel="noreferrer">{{ t.ctaGit }}</a>
                    </div>
                    <div class="rf-stats rf-pop" style="--d:.38s">
                        <div v-for="s in t.stats" :key="s.label" class="rf-stat">
                            <b>{{ s.num }}</b>
                            <span>{{ s.label }}</span>
                        </div>
                    </div>
                </div>

                <div class="rf-board rf-pop" style="--d:.2s">
                    <span class="rf-sticker rf-sticker-1" aria-hidden="true">⚡</span>
                    <span class="rf-sticker rf-sticker-2" aria-hidden="true">🤖</span>

                    <figure class="rf-win rf-win-code">
                        <figcaption class="rf-win-bar">
                            <i class="rf-dot rf-dot-pink"></i>
                            <i class="rf-dot rf-dot-green"></i>
                            <i class="rf-dot rf-dot-cyan"></i>
                            <span>{{ t.winCode }}</span>
                        </figcaption>
                        <pre class="rf-code"><span class="a">@Erupt</span>(name = <span class="s">"{{ t.codeTitle }}"</span>)
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

                    <span class="rf-arrow-chip">{{ t.arrowChip }} ↓</span>

                    <figure class="rf-win rf-win-ui">
                        <figcaption class="rf-win-bar">
                            <i class="rf-dot rf-dot-green"></i>
                            <span>{{ t.winUi }}</span>
                        </figcaption>
                        <div class="rf-ui">
                            <div class="rf-ui-bar">
                                <span class="rf-ui-title">{{ t.codeTitle }}</span>
                                <span class="rf-ui-btn rf-ui-btn-acc">{{ t.uiAdd }}</span>
                                <span class="rf-ui-btn">{{ t.uiSearch }}</span>
                            </div>
                            <div class="rf-ui-row rf-ui-head">
                                <i class="rf-ui-cb"></i>
                                <span v-for="c in t.uiCols" :key="c">{{ c }}</span>
                            </div>
                            <div v-for="i in 3" :key="i" class="rf-ui-row">
                                <i class="rf-ui-cb"></i>
                                <span><i class="rf-ui-line" :style="{ width: (72 - i * 12) + '%' }"></i></span>
                                <span><i class="rf-ui-pill" :class="{ off: i === 3 }"></i></span>
                                <span><i class="rf-ui-line" style="width:55%"></i></span>
                            </div>
                        </div>
                    </figure>
                </div>
            </div>
        </section>

        <footer class="rf-tech">
            <div class="rf-tech-inner">
                <span v-for="item in techItems" :key="item">{{ item }}</span>
            </div>
        </footer>
    </div>
</template>

<style>
/* ---- page-level tokens (html.eh-home) ---- */
.eh-home {
    --rf-bg: #FFF9EE;
    --rf-paper: #FFFFFF;
    --rf-ink: #14120B;
    --rf-line: #14120B;
    --rf-txt: #14120B;
    --rf-txt2: #5C5647;
    --rf-pink: #F585B4;
    --rf-cyan: #4FC8EC;
    --rf-green: #93D655;
    --rf-purple: #BCA0F2;
    background: var(--rf-bg);
}

.eh-home.dark {
    --rf-bg: #17140D;
    --rf-paper: #201C12;
    --rf-ink: #F0E8D6;
    --rf-line: #F0E8D6;
    --rf-txt: #F0E8D6;
    --rf-txt2: #B0A78F;
}

.eh-home body {
    background: transparent;
}

.eh-home .VPNav,
.eh-home .VPNavBar {
    background: var(--rf-bg) !important;
}

.eh-home .VPNavBar .content-body {
    background: transparent !important;
}

.eh-home .VPNavBar {
    border-bottom: 2px solid var(--rf-line) !important;
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
.rf {
    --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    --black: #14120B;
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    background: var(--rf-bg);
    color: var(--rf-txt);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

/* ============ HERO (single screen) ============ */
.rf-hero {
    flex: 1;
    display: flex;
    align-items: center;
    padding: calc(var(--vp-nav-height) + 20px) 32px 32px;
}

.rf-hero-inner {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    gap: 56px;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

.rf-kicker {
    display: inline-block;
    font-family: var(--mono);
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: .12em;
    color: var(--black);
    background: var(--rf-cyan);
    border: 2px solid var(--black);
    padding: 4px 12px;
    margin: 0 0 22px;
    transform: rotate(-1deg);
    box-shadow: 3px 3px 0 var(--rf-line);
}

.rf-title {
    font-size: clamp(38px, 4.4vw, 62px);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -.01em;
    color: var(--rf-txt);
    margin: 0 0 18px;
}

.rf-hl {
    display: inline-block;
    background: var(--rf-cyan);
    color: var(--black);
    padding: 0 12px 3px;
    transform: rotate(-1deg);
    box-shadow: 4px 4px 0 var(--rf-line);
}

.rf-desc {
    font-size: 15px;
    line-height: 1.8;
    color: var(--rf-txt2);
    max-width: 440px;
    margin: 0 0 24px;
}

/* ---- buttons ---- */
.rf-ctas {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 28px;
}

.rf-btn {
    display: inline-block;
    font-size: 14px;
    font-weight: 800;
    text-decoration: none;
    color: var(--rf-txt);
    background: var(--rf-paper);
    border: 2px solid var(--rf-line);
    padding: 10px 22px;
    box-shadow: 4px 4px 0 var(--rf-line);
    transition: transform .15s ease, box-shadow .15s ease;
}

.rf-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 6px 6px 0 var(--rf-line);
}

.rf-btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--rf-line);
}

.rf-btn-main {
    background: var(--rf-pink);
    color: var(--black);
}

/* ---- stats ---- */
.rf-stats {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.rf-stat {
    background: var(--rf-paper);
    border: 2px solid var(--rf-line);
    padding: 8px 16px;
    box-shadow: 3px 3px 0 var(--rf-line);
}

.rf-stat b {
    display: block;
    font-family: var(--mono);
    font-size: 20px;
    font-weight: 800;
    line-height: 1.2;
    color: var(--rf-txt);
}

.rf-stat span {
    font-size: 11px;
    letter-spacing: .04em;
    color: var(--rf-txt2);
}

/* ---- hero board ---- */
.rf-board {
    position: relative;
    padding: 10px 8px;
}

.rf-win {
    position: relative;
    margin: 0;
    background: var(--rf-paper);
    border: 2px solid var(--rf-line);
    box-shadow: 7px 7px 0 var(--rf-line);
}

.rf-win-code {
    width: 82%;
    z-index: 2;
    transform: rotate(-1.4deg);
}

.rf-win-ui {
    width: 74%;
    margin: -28px 0 0 auto;
    z-index: 3;
    transform: rotate(1.2deg);
}

.rf-win-bar {
    display: flex;
    align-items: center;
    gap: 7px;
    border-bottom: 2px solid var(--rf-line);
    padding: 8px 14px;
}

.rf-win-bar span {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .06em;
    color: var(--rf-txt);
    margin-left: 6px;
}

.rf-dot {
    width: 11px;
    height: 11px;
    border-radius: 50%;
    border: 2px solid var(--rf-line);
    flex: 0 0 auto;
}

.rf-dot-pink { background: var(--rf-pink); }
.rf-dot-cyan { background: var(--rf-cyan); }
.rf-dot-green { background: var(--rf-green); }

.rf-code {
    margin: 0;
    padding: 14px 16px;
    background: #1A170F;
    font-family: var(--mono);
    font-size: 11.5px;
    line-height: 1.6;
    color: #F0E8D6;
    overflow: hidden;
    white-space: pre;
}

.rf-code .a { color: #F585B4; font-weight: 700; }
.rf-code .k { color: #4FC8EC; font-weight: 700; }
.rf-code .s { color: #93D655; }

.rf-arrow-chip {
    position: absolute;
    left: 4%;
    top: 56%;
    z-index: 4;
    font-family: var(--mono);
    font-size: 11.5px;
    font-weight: 800;
    letter-spacing: .08em;
    color: var(--black);
    background: var(--rf-cyan);
    border: 2px solid var(--black);
    padding: 4px 11px;
    transform: rotate(-4deg);
    box-shadow: 3px 3px 0 var(--rf-line);
}

/* ---- stickers ---- */
.rf-sticker {
    position: absolute;
    z-index: 5;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    font-size: 22px;
    border: 2px solid var(--black);
    box-shadow: 3px 3px 0 var(--rf-line);
}

.rf-sticker-1 { top: -14px; right: 8%; background: var(--rf-green); transform: rotate(8deg); }
.rf-sticker-2 { bottom: -8px; left: 2%; background: var(--rf-purple); transform: rotate(-7deg); }

/* ---- ui wireframe ---- */
.rf-ui {
    padding: 10px 14px 14px;
}

.rf-ui-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.rf-ui-title {
    font-size: 13px;
    font-weight: 800;
    color: var(--rf-txt);
    margin-right: auto;
}

.rf-ui-btn {
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 700;
    color: var(--rf-txt2);
    border: 2px solid var(--rf-line);
    padding: 3px 10px;
}

.rf-ui-btn-acc {
    color: var(--black);
    background: var(--rf-pink);
}

.rf-ui-row {
    display: grid;
    grid-template-columns: 22px 1.2fr .9fr 1fr;
    align-items: center;
    gap: 8px;
    padding: 7px 2px;
    border-top: 1px solid var(--rf-txt2);
}

.rf-ui-head {
    border-top: 2px solid var(--rf-line);
    font-family: var(--mono);
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: .05em;
    color: var(--rf-txt2);
}

.rf-ui-cb {
    width: 10px;
    height: 10px;
    border: 2px solid var(--rf-txt2);
}

.rf-ui-line {
    display: inline-block;
    height: 7px;
    background: var(--rf-txt2);
    opacity: .5;
    vertical-align: middle;
}

.rf-ui-pill {
    display: inline-block;
    width: 28px;
    height: 12px;
    background: var(--rf-green);
    border: 2px solid var(--rf-line);
    vertical-align: middle;
}

.rf-ui-pill.off { background: transparent; }

/* ============ TECH STRIP (bottom of viewport) ============ */
.rf-tech {
    background: var(--rf-cyan);
    border-top: 2px solid var(--black);
    padding: 13px 24px;
}

.rf-tech-inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px 0;
    max-width: 1100px;
    margin: 0 auto;
}

.rf-tech-inner span {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .05em;
    color: var(--black);
    white-space: nowrap;
}

.rf-tech-inner span + span::before {
    content: '·';
    margin: 0 13px;
    opacity: .45;
}

/* ============ ANIMATIONS ============ */
.rf-pop {
    opacity: 0;
    transform: translateY(16px);
    animation: rf-in .6s cubic-bezier(.2, .7, .3, 1) forwards;
    animation-delay: var(--d, 0s);
}

@keyframes rf-in {
    to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
    .rf-pop {
        animation: none;
        opacity: 1;
        transform: none;
    }
}

/* ============ RESPONSIVE ============ */
@media (max-width: 960px) {
    .rf { min-height: auto; }
    .rf-hero { padding: calc(var(--vp-nav-height) + 32px) 24px 48px; }
    .rf-hero-inner { grid-template-columns: 1fr; gap: 48px; }
    .rf-board { margin: 0 auto; max-width: 560px; width: 100%; }
}

@media (max-width: 560px) {
    .rf-title { font-size: clamp(34px, 9.5vw, 44px); }
    .rf-win-code { width: 100%; transform: rotate(-.8deg); }
    .rf-win-ui { width: 94%; margin-top: -14px; transform: rotate(.8deg); }
    .rf-arrow-chip { display: none; }
    .rf-sticker { width: 38px; height: 38px; font-size: 19px; }
    .rf-btn { padding: 9px 18px; font-size: 13.5px; }
}
</style>
