#!/usr/bin/env node
// 考情解读演示（公开课用）· 独立产物 slides.html，不影响站点五页
// 键盘 ← → / 空格翻页，F 全屏，O 总览，?p=N 直接跳页
// 视觉与数学站 slides 一致：1280×720 舞台等比缩放
import { writeFileSync } from 'node:fs';

import {
  PAPER_STATS, YEARS, N_PAPERS,
  SEG_SCORE, SEG_NAME, SEG_ORDER, CAT_SCORE, CAT_ORDER, CAT_NAME,
  DIFF_SCORE, DIFF_ORDER, DIFF_NAME, MODE_SCORE, MODE_BREAKDOWN,
  FAM_MAP, PROP_SUMMARY, PROP_LEVEL_NAME, GRAMMAR_DOUBLE, GRAMMAR_FAMS,
  SPELL_ITEMS, SPELL_FEATURES, SPELL_STATS, SPELL_SEGMENTS, SPELL_TOTAL,
  SENT_ITEMS, SENT_GROUPS,
} from './work/papers/stats.mjs';
import { LEDGER, SEG_ORDER as SEGO } from './work/papers/ledger.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ============================ 派生量 ============================ */
const MAIN = PAPER_STATS[0].mainTotal;      // 90 必做
const ALL = PAPER_STATS[0].allTotal;        // 100 全卷
const BONUS_SEGS = ['阅读简答', '阅读选择'];
const BONUS = PAPER_STATS[0].bonusTotal;
const MAIN_N = PAPER_STATS[0].mainCount;
const SEL = MODE_SCORE.select.avg;
const WRI = MODE_SCORE.write.avg;
const SEL_PCT = MODE_SCORE.select.pct;
const WRI_PCT = MODE_SCORE.write.pct;
const BASE = DIFF_SCORE.easy.avg;
const MID = DIFF_SCORE.mid.avg;
const HARD = DIFF_SCORE.hard.avg;
const BASE_MID = +(BASE + MID).toFixed(1);
const BASE_MID_PCT = Math.round((BASE_MID / ALL) * 100);
const DIFF_IDX = PAPER_STATS.map((p) => p.diffIndex);
const DIFF_IDX_MIN = Math.min(...DIFF_IDX);
const DIFF_IDX_MAX = Math.max(...DIFF_IDX);

const WRITE_SEGS = SEG_ORDER.filter((s) => {
  const qs = LEDGER.filter((q) => q.seg === s && !q.bonus);
  return qs.length && qs.every((q) => q.mode === 'write');
});
const SELECT_SEGS = SEG_ORDER.filter((s) => !WRITE_SEGS.includes(s));

const FAM_RANKED = FAM_MAP.filter((f) => !f.onlyBonus);
const TOP_FAMS = FAM_RANKED.slice(0, 7);
const STABLE = PROP_SUMMARY.stable;
const VARIABLE = PROP_SUMMARY.variable;
const SPORADIC = PROP_SUMMARY.sporadic;
const DOUBLE = GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0);
const SPELL_TOP = SPELL_FEATURES.slice(0, 6);
// 学年跨度中文数字，不写死「4 年」
const SPAN_CN = ['', '一', '二', '三', '四', '五', '六'][N_PAPERS] || String(N_PAPERS);

/* ============================ 样式 ============================ */
const CSS = `
:root{
  --bg:#f6f8fc; --surface:#fff; --surface-2:#f8fafd;
  --border:rgba(15,23,42,.09); --text:#0f172a; --text-2:#475569; --text-3:#64748b;
  --accent:#2563eb; --accent-grad:linear-gradient(135deg,#2563eb,#4f46e5);
  --purple:#7c3aed; --gold:#d97706; --gold-grad:linear-gradient(135deg,#f59e0b,#d97706);
  --ok:#059669; --rose:#e11d48;
  --accent-soft:rgba(37,99,235,.08); --gold-soft:rgba(245,158,11,.12);
  --rose-soft:rgba(225,29,72,.085); --ok-soft:rgba(16,185,129,.10);
  --shadow:0 16px 36px -10px rgba(15,23,42,.11),0 4px 12px -2px rgba(15,23,42,.05);
  --sans:-apple-system,BlinkMacSystemFont,"SF Pro Display","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{font-family:var(--sans);background:#0f172a;color:var(--text);-webkit-font-smoothing:antialiased}

/* 舞台：16:9，按窗口等比缩放 */
#stage{position:fixed;inset:0;display:grid;place-items:center;background:#0b1120}
#deck{width:1280px;height:720px;position:relative;background:var(--bg);overflow:hidden;
  transform-origin:center center;box-shadow:0 30px 80px -20px rgba(0,0,0,.6)}

.slide{position:absolute;inset:0;padding:64px 72px;display:none;flex-direction:column;
  background:var(--bg);overflow:hidden;
  text-wrap:pretty;            /* 避免末行只剩一两个字 */
  word-break:normal;line-break:strict}
.slide.on{display:flex}

/* 标题页 */
.s-cover{justify-content:flex-start;padding-top:96px;
  background:radial-gradient(ellipse 90% 70% at 20% 0%,rgba(37,99,235,.12),transparent 65%),var(--bg)}
.cover-badge{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--accent);
  background:var(--surface);border:1px solid rgba(37,99,235,.24);padding:6px 15px;border-radius:999px;
  width:fit-content;margin-bottom:26px;box-shadow:0 1px 3px rgba(15,23,42,.04)}
.cover-badge i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.16)}
.cover-h{font-size:62px;font-weight:800;letter-spacing:-.035em;line-height:1.16;margin-bottom:22px}
.cover-h em{font-style:normal;background:var(--accent-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.cover-sub{font-size:19px;color:var(--text-2);line-height:1.7;max-width:820px}
.cover-points{display:flex;flex-direction:column;gap:12px;margin:34px 0 auto}
.cp{display:grid;grid-template-columns:44px 132px 1fr;gap:14px;align-items:baseline;
  background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:14px 20px;
  box-shadow:0 1px 3px rgba(15,23,42,.04)}
.cp-n{font-family:var(--mono);font-size:12.5px;font-weight:800;color:var(--accent);letter-spacing:.06em}
.cp b{font-size:15px;font-weight:700}
.cp span:last-child{font-size:13px;color:var(--text-3)}
.cover-meta{margin-top:auto;padding-top:32px;display:flex;gap:44px;border-top:1px solid var(--border)}
.cover-meta div{display:flex;flex-direction:column;gap:2px}
.cover-meta b{font-size:26px;font-weight:780;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.cover-meta span{font-size:12.5px;color:var(--text-3)}

/* 内容页头 */
.s-head{margin-bottom:30px;flex:none}
.s-kicker{font-family:var(--mono);font-size:11.5px;letter-spacing:.11em;text-transform:uppercase;
  color:var(--accent);font-weight:650;margin-bottom:9px;display:block}
.s-title{font-size:38px;font-weight:780;letter-spacing:-.028em;line-height:1.24}
.s-sub{font-size:14.5px;color:var(--text-3);margin-top:8px}
.s-body{flex:1;min-height:0;display:flex;flex-direction:column;justify-content:center;padding:6px 0 4px;
  padding-top:2%;padding-bottom:2%}

/* 大数字组 */
.bignums{display:grid;gap:18px}
.bn{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:22px 24px;
  box-shadow:0 1px 3px rgba(15,23,42,.04)}
.bn-n{font-size:46px;font-weight:800;letter-spacing:-.04em;line-height:1.05;font-variant-numeric:tabular-nums}
.bn-n small{font-size:16px;font-weight:650;color:var(--text-3);margin-left:3px}
.bn-l{font-size:13.5px;font-weight:650;margin-top:7px}
.bn-d{font-size:12.5px;color:var(--text-3);margin-top:3px;line-height:1.5}
.bn.blue .bn-n{color:var(--accent)}
.bn.gold .bn-n{color:var(--gold)}
.bn.rose .bn-n{color:var(--rose)}
.bn.ok .bn-n{color:var(--ok)}

/* 条形对比 */
.bars{display:flex;flex-direction:column;gap:14px}
.bar-row{display:grid;grid-template-columns:88px 1fr 74px;align-items:center;gap:14px}
.bar-lbl{font-size:14px;font-weight:650}
.bar-track{height:26px;background:var(--surface-2);border:1px solid var(--border);border-radius:7px;
  overflow:hidden;position:relative}
.bar-fill{display:block;height:100%;border-radius:6px}
.bar-fill.blue{background:var(--accent-grad)}
.bar-fill.gold{background:var(--gold-grad)}
.bar-val{font-size:14px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}

/* 堆叠条（难度结构） */
.stack{display:flex;height:44px;border-radius:10px;overflow:hidden;border:1px solid var(--border);background:var(--surface-2)}
.stack i{display:block;height:100%;position:relative}
.stack i span{position:absolute;inset:0;display:grid;place-items:center;font-size:12.5px;font-weight:700;color:#fff}
.seg-easy{background:linear-gradient(135deg,#10b981,#059669)}
.seg-mid{background:var(--accent-grad)}
.seg-hard{background:var(--gold-grad)}
.seg-top{background:linear-gradient(135deg,#f43f5e,#e11d48)}
.legend{display:flex;gap:20px;margin-top:14px;font-size:12.5px;color:var(--text-2);flex-wrap:wrap}
.legend span{display:flex;align-items:center;gap:6px}
.legend i{width:11px;height:11px;border-radius:3px;display:block}

/* 表格 */
.tbl{width:100%;border-collapse:collapse;font-size:14px;background:var(--surface);
  border:1px solid var(--border);border-radius:12px;overflow:hidden}
.tbl th,.tbl td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap}
.tbl th{font-size:11.5px;font-weight:700;color:var(--text-3);letter-spacing:.04em;background:var(--surface-2)}
.tbl td.num,.tbl th.num{text-align:right;font-variant-numeric:tabular-nums}
.tbl tbody tr:last-child td{border-bottom:none}
.tbl .hi{color:var(--accent);font-weight:700}
.tbl .grp td{background:var(--bg);font-weight:700;font-size:13.5px}

.tbl.compact{font-size:12.5px}
.tbl.compact th,.tbl.compact td{padding:6px 12px}
.tbl.compact .grp td{padding:6px 12px;font-size:12.5px}

/* 两栏 */
.two{display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:start}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;
  box-shadow:0 1px 3px rgba(15,23,42,.04)}
.card h4{font-size:15px;font-weight:700;margin-bottom:12px}

/* 结论条 */
.callout{text-wrap:pretty;background:var(--accent-soft);border-left:3px solid var(--accent);border-radius:0 10px 10px 0;
  padding:15px 20px;font-size:14.5px;color:var(--text-2);line-height:1.72}
.callout b{color:var(--text)}
.callout.gold{background:var(--gold-soft);border-color:var(--gold)}
.callout.rose{background:var(--rose-soft);border-color:var(--rose)}

/* 优先级列表 */
.pri-list{display:flex;flex-direction:column;gap:11px}
.pri-item{display:grid;grid-template-columns:44px 1fr auto;gap:16px;align-items:center;
  background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:15px 20px}
.pri-no{font-family:var(--mono);font-size:19px;font-weight:800;color:var(--accent);text-align:center}
.pri-item:nth-child(2) .pri-no{color:var(--purple)}
.pri-item:nth-child(3) .pri-no{color:var(--ok)}
.pri-item:nth-child(4) .pri-no{color:var(--gold)}
.pri-item:nth-child(5) .pri-no{color:var(--text-3)}
.pri-t{font-size:15px;font-weight:700}
.pri-s{font-size:12.5px;color:var(--text-3);margin-top:2px}
.pri-v{font-size:13.5px;font-weight:700;color:var(--text-2);font-variant-numeric:tabular-nums;white-space:nowrap}

/* 结尾页 */
.s-end{justify-content:center;align-items:flex-start;
  background:radial-gradient(ellipse 90% 70% at 20% 0%,rgba(37,99,235,.12),transparent 65%),var(--bg)}
.end-h{font-size:52px;font-weight:800;letter-spacing:-.035em;line-height:1.2;margin-bottom:20px}
.end-list{display:flex;flex-direction:column;gap:12px;margin-top:10px}
.end-item{display:flex;gap:12px;font-size:16px;color:var(--text-2);align-items:baseline}
.end-item b{color:var(--text);font-weight:700}
.end-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);flex:none;margin-top:8px}

/* 页码 / 进度 */
#pager{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:20;
  display:flex;align-items:center;gap:14px;background:rgba(15,23,42,.72);backdrop-filter:blur(10px);
  padding:8px 16px;border-radius:999px;color:#cbd5e1;font-size:12.5px;font-family:var(--mono)}
#pager button{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:15px;padding:2px 6px;
  border-radius:5px;line-height:1}
#pager button:hover{color:#fff;background:rgba(255,255,255,.12)}
#pager .cur{color:#fff;font-weight:700}
#bar{position:fixed;top:0;left:0;height:2px;background:var(--accent-grad);z-index:30;transition:width .3s}

/* 总览 */
#overview{position:fixed;inset:0;background:rgba(11,17,32,.96);z-index:40;display:none;
  padding:40px;overflow:auto}
#overview.on{display:block}
#overview h3{color:#e2e8f0;font-size:15px;font-weight:650;margin-bottom:20px}
.ov-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
.ov-card{background:#1e293b;border:2px solid transparent;border-radius:10px;padding:12px 14px;
  cursor:pointer;transition:.15s}
.ov-card:hover{border-color:#3b82f6}
.ov-card .n{font-family:var(--mono);font-size:11px;color:#64748b}
.ov-card .t{font-size:13px;color:#e2e8f0;margin-top:4px;font-weight:600;line-height:1.4}

/* 打印 / 导出 PDF */
@media print{
  @page{size:1280px 720px;margin:0}
  html,body{overflow:visible;background:#fff}
  #stage{position:static;display:block}
  #deck{width:1280px;height:auto;transform:none!important;box-shadow:none}
  .slide{position:relative;display:flex!important;page-break-after:always;height:720px}
  #pager,#bar,#overview{display:none!important}
}

`;

/* ============================ 幻灯片内容 ============================ */
const deck = [];
const push = (title, html) => deck.push({ title, html });

/* 1. 封面 */
push('封面', `
<div class="slide s-cover on">
  <div class="cover-badge"><i></i>西城区区统考 · ${N_PAPERS} 套真题逐题拆解</div>
  <h1 class="cover-h">丢分的不是不会<br><em>是写不对</em></h1>
  <p class="cover-sub">
    初一（上）英语期末，全卷 ${ALL} 分里 <b>${fmt(SEL)} 分只要涂卡</b>，
    剩下 <b>${fmt(WRI)} 分必须写出文字</b>——听写、简答、音标、汉译英、作文。
    这 ${SPAN_CN} 年的卷子结构一动没动，所以分数差距几乎全在输出端的形式准确性上。
  </p>
  <div class="cover-points">
    <div class="cp"><span class="cp-n">01</span><b>结构${SPAN_CN}年零变化</b><span>十个板块分值逐年一致，按板块复习成立</span></div>
    <div class="cp"><span class="cp-n">02</span><b>${fmt(WRI)} 分要写出来</b><span>输出型占卷面 ${WRI_PCT}%，这才是提分空间</span></div>
    <div class="cp"><span class="cp-n">03</span><b>难度不在压轴</b><span>较难只占 ${DIFF_SCORE.hard.pct}%，要把中档做满</span></div>
  </div>
</div>`);

/* 2. 卷面结构 */
push('卷面结构', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Structure</span>
    <h2 class="s-title">卷面骨架：${SPAN_CN}年一动没动</h2>
    <p class="s-sub">十个板块的分值逐年完全一致——这是「按板块复习」能成立的全部依据</p>
  </div>
  <div class="s-body">
    <div class="bignums" style="grid-template-columns:repeat(4,1fr)">
      <div class="bn blue"><div class="bn-n">${MAIN}<small>分</small></div><div class="bn-l">必做满分</div><div class="bn-d">${MAIN_N} 小题 · 100 分钟</div></div>
      <div class="bn blue"><div class="bn-n">${fmt(SEL)}<small>分</small></div><div class="bn-l">选择型</div><div class="bn-d">只涂卡 · ${SEL_PCT}%</div></div>
      <div class="bn rose"><div class="bn-n">${fmt(WRI)}<small>分</small></div><div class="bn-l">输出型</div><div class="bn-d">要写出来 · ${WRI_PCT}%</div></div>
      <div class="bn gold"><div class="bn-n">${BONUS}<small>分</small></div><div class="bn-l">选做</div><div class="bn-d">计入总分但卷面封顶 ${MAIN}</div></div>
    </div>
    <div class="callout" style="margin-top:26px">
      <b>唯一会骗人的地方是题号。</b>2024-25 全卷 62 题、单选从第 1 题重新编号；
      另三套 57 题、连续编号。<b>背「第 13 题考代词」会在换卷时失手，要按板块识别。</b>
    </div>
  </div>
</div>`);

/* 3. 核心切口：选择 vs 输出 */
push('核心切口', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">The Split</span>
    <h2 class="s-title">${MAIN} 分不是均匀分布的</h2>
    <p class="s-sub">按「要不要写出文字」切开——这是整场最要紧的一刀</p>
  </div>
  <div class="s-body">
    <div class="stack">
      <i class="seg-easy" style="width:${SEL_PCT}%"><span>选择型 ${fmt(SEL)} 分 · ${SEL_PCT}%</span></i>
      <i class="seg-hard" style="width:${WRI_PCT}%"><span>输出型 ${fmt(WRI)} 分</span></i>
    </div>
    <div class="legend">
      <span><i class="seg-easy"></i>选择型：听选 / 单选 / 完形 / 阅读选择</span>
      <span><i class="seg-hard"></i>输出型：听填 / 简答 / 音标 / 汉译英 / 作文</span>
    </div>
    <table class="tbl" style="margin-top:22px">
      <thead><tr><th>类型</th><th>板块</th><th class="num">分值</th><th>错在哪</th><th>补救动作</th></tr></thead>
      <tbody>
        <tr><td><b style="color:var(--accent)">选择型</b></td><td>${SELECT_SEGS.map((s) => SEG_NAME[s]).join(' / ')}</td><td class="num hi">${fmt(SEL)}</td><td>词没认到 / 没读懂</td><td>认读、精读</td></tr>
        <tr><td><b style="color:var(--rose)">输出型</b></td><td>${WRITE_SEGS.map((s) => SEG_NAME[s]).join(' / ')}</td><td class="num hi">${fmt(WRI)}</td><td>拼写错 / 形式错</td><td>默写、句型改写</td></tr>
      </tbody>
    </table>
    <div class="callout" style="margin-top:20px">
      <b>这 ${fmt(WRI)} 分丢的不是「不会」</b>，是三单忘加 s、过去时写原形、简答照抄原句人称没换、音标认识但拼错。
      <b>知道规则也不保证写对，必须靠定向操练固化。</b>
    </div>
  </div>
</div>`);

/* 4. 难度结构 */
push('难度结构', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Difficulty</span>
    <h2 class="s-title">难度${SPAN_CN}年几乎不动</h2>
    <p class="s-sub">基础 ${fmt(BASE)} 分 ／ 中档 ${fmt(MID)} 分 ／ 较难 ${fmt(HARD)} 分</p>
  </div>
  <div class="s-body">
    <div class="stack">
      <i class="seg-easy" style="width:${DIFF_SCORE.easy.pct}%"><span>基础 ${DIFF_SCORE.easy.pct}%</span></i>
      <i class="seg-mid" style="width:${DIFF_SCORE.mid.pct}%"><span>中档 ${DIFF_SCORE.mid.pct}%</span></i>
      <i class="seg-hard" style="width:${DIFF_SCORE.hard.pct}%"></i>
    </div>
    <div class="legend">
      <span><i class="seg-easy"></i>基础 年均 ${fmt(BASE)} 分</span>
      <span><i class="seg-mid"></i>中档 年均 ${fmt(MID)} 分</span>
      <span><i class="seg-hard"></i>较难 年均 ${fmt(HARD)} 分</span>
    </div>
    <table class="tbl compact" style="margin-top:22px">
      <thead><tr><th>年份</th>${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}<th class="num">年均</th></tr></thead>
      <tbody>
        ${DIFF_ORDER.map((k) => `<tr><td><b>${DIFF_NAME[k]}</b></td>${DIFF_SCORE[k].per.map((v) => `<td class="num">${fmt(v)}</td>`).join('')}<td class="num hi">${fmt(DIFF_SCORE[k].avg)}</td></tr>`).join('')}
      </tbody>
    </table>
    <div class="callout" style="margin-top:20px">
      <b>难度指数</b>（1 = 全基础，3 = 全较难）逐年：${PAPER_STATS.map((p) => `${p.label} <b>${p.diffIndex}</b>`).join(' · ')}。
      <br>区间 ${DIFF_IDX_MIN}–${DIFF_IDX_MAX}——<b>难度是被稳定控制的，没有「某年突然变难」这回事。</b>
    </div>
  </div>
</div>`);

/* 5. 考点族权重 */
push('考点族权重', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Weight</span>
    <h2 class="s-title">分值最高的 ${TOP_FAMS.length} 个考点族</h2>
    <p class="s-sub">按年均分值降序——这才该是排优先级的依据</p>
  </div>
  <div class="s-body">
    <table class="tbl compact">
      <thead><tr><th>考点族</th><th>板块</th><th class="num">年均分</th><th class="num">占卷面</th><th>作答</th><th>说明</th></tr></thead>
      <tbody>
        ${TOP_FAMS.map((f) => {
          const isWrite = f.qs.length > 0 && f.qs.every((q) => q.mode === 'write');
          return `<tr>
            <td><b>${esc(f.name)}</b></td>
            <td style="color:var(--text-3);font-size:12.5px">${f.seg.map((s) => SEG_NAME[s]).join('、')}</td>
            <td class="num hi">${fmt(f.avgPerYear)}</td>
            <td class="num">${Math.round((f.avgPerYear / ALL) * 100)}%</td>
            <td><span style="font-size:11.5px;font-weight:700;color:${isWrite ? 'var(--rose)' : 'var(--accent)'}">${isWrite ? '输出' : '选择'}</span></td>
            <td style="color:var(--text-3);font-size:12.3px">${esc(f.note)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    <div class="callout gold" style="margin-top:14px;font-size:13px">
      前 ${TOP_FAMS.length} 族合计年均 <b>${fmt(sum(TOP_FAMS.map((f) => f.avgPerYear)))} 分</b>，
      占全卷 ${ALL} 分的 <b>${Math.round((sum(TOP_FAMS.map((f) => f.avgPerYear)) / ALL) * 100)}%</b>。
      首末族年均分差 <b>${fmt(TOP_FAMS[0].avgPerYear - TOP_FAMS[TOP_FAMS.length - 1].avgPerYear)} 分</b>——这个差距就是优先级。
    </div>
  </div>
</div>`);

/* 6. 命题稳定性 */
push('命题稳定性', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Stability</span>
    <h2 class="s-title">哪些年年考，哪些只在个别年出现</h2>
    <p class="s-sub">这是「全区命题是否有差异」的直接证据</p>
  </div>
  <div class="s-body">
    <div class="bignums" style="grid-template-columns:repeat(3,1fr)">
      <div class="bn ok"><div class="bn-n">${STABLE.length}</div><div class="bn-l">年年考</div><div class="bn-d">${N_PAPERS}/${N_PAPERS} 学年都出现，按「必练」对待</div></div>
      <div class="bn blue"><div class="bn-n">${VARIABLE.length}</div><div class="bn-l">多数年考</div><div class="bn-d">要会，但不押</div></div>
      <div class="bn gold"><div class="bn-n">${SPORADIC.length}</div><div class="bn-l">个别年考</div><div class="bn-d">只在一两个学年，认识即可</div></div>
    </div>
    <div class="callout" style="margin-top:22px">
      <b>不要把「都考」当成「都值钱」。</b>${STABLE.length} 个年年考的族，年均分从
      <b>${fmt(STABLE[0].avgPerYear)} 分到 ${fmt(STABLE[STABLE.length - 1].avgPerYear)} 分</b>不等。
      所以主排序用分值权重，命中次数只作事实列。
    </div>
    <div class="callout gold" style="margin-top:14px">
      <b>个别年考的 ${SPORADIC.length} 个族</b>：${SPORADIC.map((f) => `${esc(f.name)}（${f.hit}/${N_PAPERS}）`).join('、')}。
      这正是「全区命题有差异」的具体形态——<b>不是每年都考同一套考点</b>。
    </div>
  </div>
</div>`);

/* 7. 语法：两次考核 */
push('语法两次考核', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Grammar</span>
    <h2 class="s-title">语法在卷面上被考了两次</h2>
    <p class="s-sub">单选考「认不认得出」，汉译英考「写不写得对」</p>
  </div>
  <div class="s-body">
    <div class="callout" style="margin-bottom:14px;font-size:13px">
      <b>10 个语法族全部只出现在单项填空里，产出分为 0。</b>但这不等于语法只在单选考 ${fmt(SEG_SCORE['单选'].avg)} 分——
      它换了名字出现在汉译英和文段表达里。<b>同一能力，两种考法，要用两种练法。</b>
    </div>
    <table class="tbl compact" style="font-size:13.2px">
      <thead><tr><th>语法族</th><th class="num">年均分</th><th class="num">单选命中</th><th class="num">汉译英出现</th><th>判定</th></tr></thead>
      <tbody>
        ${GRAMMAR_DOUBLE.slice(0, 5).map((g) => `<tr>
          <td><b>${esc(g.name)}</b></td>
          <td class="num">${fmt(g.avgPerYear)}</td>
          <td class="num">${g.hit}/${N_PAPERS}</td>
          <td class="num" style="font-weight:${g.writeHits ? 700 : 400};color:${g.writeHits ? 'var(--rose)' : 'var(--text-3)'}">${g.writeHits || '—'}</td>
          <td style="font-size:12.3px;color:var(--text-3)">${PROP_LEVEL_NAME[g.level]}${g.writeHits ? ' · 双重考核' : ''}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="callout gold" style="margin-top:14px;font-size:13px">
      <b>${DOUBLE.length} 个族是「双重考核」</b>：${DOUBLE.map((g) => `${esc(g.name)}（单选 ${g.hit}/${N_PAPERS} + 汉译英 ${g.writeHits} 句）`).join('、')}。
      这几族既要会选又要会写，<b>优先级高于只在单选出现的族</b>。
    </div>
  </div>
</div>`);

/* 8. 汉译英动作频次 */
push('汉译英动作', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Translation</span>
    <h2 class="s-title">${SENT_ITEMS.length} 句汉译英：语法真正被「写」出来的地方</h2>
    <p class="s-sub">每句都标了实际要求的语法动作</p>
  </div>
  <div class="s-body">
    <div class="bignums" style="grid-template-columns:repeat(${Math.min(SENT_GROUPS.length, 5)},1fr)">
      ${SENT_GROUPS.map((g, i) => `<div class="bn ${['rose', 'blue', 'gold', 'ok', 'blue'][i % 5]}"><div class="bn-n">${g.count}<small>句</small></div><div class="bn-l">${esc(g.label)}</div><div class="bn-d">${g.items.slice(0, 2).map((x) => esc(x.zh.replace(/。$/, ''))).join(' / ')}${g.items.length > 2 ? ' …' : ''}</div></div>`).join('')}
    </div>
    <div class="callout" style="margin-top:16px;font-size:13px">
      <b>固定搭配 ${SENT_GROUPS.find((g) => g.id === 'colloc')?.count || 0} 句，比任何单一语法规则都多。</b>
      这说明汉译英的主战场不是「语法规则」，是<b>短语能不能直接写出来</b>——
      这些搭配背了就能用，不需要推理，是全卷性价比最高的投入之一。
    </div>
    <table class="tbl compact" style="margin-top:14px;font-size:13px">
      <thead><tr><th>中文原句</th><th>提示词</th><th>参考答案</th></tr></thead>
      <tbody>
        ${SENT_ITEMS.slice(0, 3).map((it) => `<tr><td><b>${esc(it.zh)}</b></td><td style="font-family:var(--mono);font-size:12.3px;color:var(--text-3)">${esc(it.hint)}</td><td style="color:var(--ok);font-size:12.5px">${esc(it.ans)}</td></tr>`).join('')}
      </tbody>
    </table>
  </div>
</div>`);

/* 9. 单词：音标 16 词 */
push('音标拼写', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Spelling</span>
    <h2 class="s-title">音标 ${SPELL_STATS.total} 个词，平均 ${SPELL_STATS.avgLen} 个字母</h2>
    <p class="s-sub">四年全部考词，最长 ${SPELL_STATS.maxLen} 个字母——不是难词</p>
  </div>
  <div class="s-body">
    <table class="tbl compact">
      <thead><tr><th class="num">年份</th><th>音标</th><th>答案</th><th class="num">字母</th><th>拼写特征</th></tr></thead>
      <tbody>
        ${SPELL_ITEMS.slice(0, 8).map((it) => `<tr>
          <td class="num" style="color:var(--text-3)">${PAPER_STATS.find((p) => p.id === it.p).label}</td>
          <td><b style="font-family:var(--mono)">${esc(it.ipa)}</b></td>
          <td><b style="color:var(--accent)">${esc(it.word)}</b></td>
          <td class="num">${it.len}</td>
          <td style="color:var(--text-3);font-size:12.3px">${it.feats.map(esc).join(' / ')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div class="callout gold" style="margin-top:14px;font-size:13px">
      <b>这些不是难词，是最基础的词</b>——平均 ${SPELL_STATS.avgLen} 个字母，最短 ${SPELL_STATS.minLen} 个。
      音标题的失分<b>不是「不认识」，是「拼不对」</b>：练法该是定向拼写，不是背难词。
    </div>
  </div>
</div>`);

/* 10. 拼写特征分类 */
push('拼写特征', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">Features</span>
    <h2 class="s-title">按易错点归成 ${SPELL_STATS.featureCount} 类</h2>
    <p class="s-sub">练词数最多的几类，就能覆盖一半以上的音标题</p>
  </div>
  <div class="s-body">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
      ${SPELL_TOP.map((f) => `<div class="card">
        <h4 style="display:flex;justify-content:space-between;align-items:baseline">${esc(f.name)}<span style="font-size:12px;color:var(--text-3);font-weight:500">${f.count} 词</span></h4>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
          ${f.items.map((i) => `<span style="font-family:var(--mono);font-size:12.5px;background:var(--accent-soft);color:var(--accent);padding:3px 8px;border-radius:6px">${esc(i.word)}</span>`).join('')}
        </div>
      </div>`).join('')}
    </div>
    <div class="callout" style="margin-top:20px">
      前 3 类（${SPELL_TOP.slice(0, 3).map((f) => esc(f.name)).join('、')}）合计覆盖
      <b>${new Set(SPELL_TOP.slice(0, 3).flatMap((f) => f.items.map((i) => i.word))).size} 个词</b>
      （占 ${SPELL_STATS.total} 词的 <b>${Math.round(new Set(SPELL_TOP.slice(0, 3).flatMap((f) => f.items.map((i) => i.word))).size / SPELL_STATS.total * 100)}%</b>）。
      <b>先练这三类，比背整本词表有效。</b>
    </div>
  </div>
</div>`);

/* 11. 怎么用这个站 */
push('怎么用', `
<div class="slide">
  <div class="s-head">
    <span class="s-kicker">How to use</span>
    <h2 class="s-title">看完这份分析，接下来做什么</h2>
    <p class="s-sub">按顺序走三步，每一步都有明确的产出</p>
  </div>
  <div class="s-body">
    <div class="phases">
      <div class="ph"><div class="ph-w">第 1 步</div><div class="ph-b"><h4>先定位：你在哪一档</h4><p>拿最近一次英语卷，必做 ${MAIN} 分口径下逐板块记分。失分集中在哪 3 个板块，就练那 3 个。</p><div class="ph-ok">产出：一张「我的失分板块」清单，不超过 3 项</div></div></div>
      <div class="ph"><div class="ph-w">第 2 步</div><div class="ph-b"><h4>再练动作：去专项页拿方法</h4><p>失分板块对应专项复习的四页之一。每页都给了「解题动作」与「备考动作」，照做，不刷题海。</p><div class="ph-ok">产出：每个失分板块能说出「我错在哪一类、对应哪个动作」</div></div></div>
      <div class="ph"><div class="ph-w">第 3 步</div><div class="ph-b"><h4>最后验收：整卷限时</h4><p>至少一次完整 100 分钟计时，必做与选做分开报分。失分必须能归到具体板块。</p><div class="ph-ok">产出：失分归因表；只报总分说明第 1 步没做</div></div></div>
    </div>
  </div>
</div>`);

/* 12. 结论 */
push('结论', `
<div class="slide s-cover" style="justify-content:center">
  <div class="cover-badge"><i></i>三句话收尾</div>
  <h1 class="cover-h" style="font-size:52px;margin-bottom:30px">记住三件事</h1>
  <div class="cover-points" style="margin:0">
    <div class="cp"><span class="cp-n">01</span><b>结构${SPAN_CN}年零变化</b><span>十个板块分值逐年一致，按板块复习，不按题号背</span></div>
    <div class="cp"><span class="cp-n">02</span><b>${fmt(WRI)} 分要写出来</b><span>输出型占 ${WRI_PCT}%，丢的是形式不是知识，靠定向操练</span></div>
    <div class="cp"><span class="cp-n">03</span><b>中档题才是主战场</b><span>基础+中档占 ${BASE_MID_PCT}%，较难只 ${DIFF_SCORE.hard.pct}%</span></div>
  </div>
  <p class="cover-sub" style="margin-top:36px;font-size:16px;max-width:none">
    样本：西城区 ${YEARS.join(' / ')} ${N_PAPERS} 套期末真题，${LEDGER.length} 题逐题标注。
    所有数字由逐题台账派生，非人工填写。
  </p>
</div>`);

/* ============================ 输出 ============================ */
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>考情解读 · 西城区初一（上）英语期末</title>
<style>${CSS}
/* 阶段表（本页新增） */
.phases{display:flex;flex-direction:column;gap:0;border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
.ph{display:grid;grid-template-columns:110px 1fr;border-bottom:1px solid var(--border)}
.ph:last-child{border-bottom:none}
.ph-w{background:var(--surface-2);padding:14px 12px;font-size:12.5px;font-weight:700;color:var(--accent);display:flex;align-items:center;border-right:1px solid var(--border)}
.ph-b{padding:13px 18px}
.ph-b h4{font-size:14.5px;font-weight:700;margin-bottom:4px}
.ph-b p{font-size:12.8px;color:var(--text-2);line-height:1.6}
.ph-ok{font-size:12px;color:var(--ok);margin-top:5px;font-weight:600}
</style>
</head>
<body>
<div id="stage"><div id="deck">
${deck.map((s) => s.html).join('\n')}
</div></div>

<div id="pager" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);z-index:20;
  display:flex;align-items:center;gap:12px;background:rgba(15,23,42,.72);backdrop-filter:blur(12px);
  padding:8px 14px;border-radius:999px;color:#e2e8f0;font-size:13px;font-family:var(--mono)">
  <button id="prev" aria-label="上一页" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:2px 6px">‹</button>
  <span><b id="cur">1</b> / ${deck.length}</span>
  <button id="next" aria-label="下一页" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;padding:2px 6px">›</button>
  <button id="ov" aria-label="总览" style="margin-left:6px;background:none;border:none;color:#94a3b8;font-size:14px;cursor:pointer">⊞</button>
  <button id="fs" aria-label="全屏" style="background:none;border:none;color:#94a3b8;font-size:14px;cursor:pointer">⛶</button>
  <a href="index.html" title="返回站点" style="color:#94a3b8;text-decoration:none;font-size:14px;padding:2px 6px">↩</a>
</div>

<div id="bar" style="position:fixed;bottom:0;left:0;height:3px;background:var(--accent-grad);z-index:21;transition:width .2s"></div>

<div id="hint" style="position:fixed;top:18px;right:20px;z-index:19;
  background:rgba(15,23,42,.66);backdrop-filter:blur(10px);color:#cbd5e1;font-size:12px;
  padding:7px 15px;border-radius:999px;opacity:1;transition:opacity .5s;pointer-events:none">
  ← → 翻页 · F 全屏 · O 总览
</div>

<div id="overview">
  <h3>总览 · 点击跳转</h3>
  <div class="ov-grid">
    ${deck.map((s, i) => `<div class="ov-card" data-go="${i}"><div class="n">${String(i + 1).padStart(2, '0')}</div><div class="t">${esc(s.title)}</div></div>`).join('')}
  </div>
</div>

<script>
(function(){
  var deck=document.getElementById('deck');
  var slides=[].slice.call(deck.querySelectorAll('.slide'));
  var i=0, N=slides.length;

  function fit(){
    var s=Math.min(window.innerWidth/1280, window.innerHeight/720);
    deck.style.transform='scale('+s+')';
  }
  window.addEventListener('resize',fit); fit();

  function show(n){
    i=Math.max(0,Math.min(N-1,n));
    slides.forEach(function(el,k){ el.classList.toggle('on', k===i); });
    document.getElementById('cur').textContent=i+1;
    document.getElementById('bar').style.width=((i+1)/N*100)+'%';
  }
  function next(){ show(i+1); }
  function prev(){ show(i-1); }

  document.getElementById('next').onclick=next;
  document.getElementById('prev').onclick=prev;
  document.getElementById('fs').onclick=function(){
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };
  var ov=document.getElementById('overview');
  document.getElementById('ov').onclick=function(){ ov.classList.toggle('on'); };
  ov.addEventListener('click',function(e){
    var c=e.target.closest('[data-go]');
    if(c){ show(+c.dataset.go); ov.classList.remove('on'); }
    else if(e.target===ov){ ov.classList.remove('on'); }
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key===' '||e.key==='PageDown'){ e.preventDefault(); next(); }
    else if(e.key==='ArrowLeft'||e.key==='PageUp'){ e.preventDefault(); prev(); }
    else if(e.key==='Home'){ show(0); }
    else if(e.key==='End'){ show(N-1); }
    else if(e.key==='f'||e.key==='F'){ document.getElementById('fs').click(); }
    else if(e.key==='o'||e.key==='O'){ ov.classList.toggle('on'); }
    else if(e.key==='Escape'){ ov.classList.remove('on'); }
  });

  var x0=null;
  document.addEventListener('touchstart',function(e){ x0=e.touches[0].clientX; },{passive:true});
  document.addEventListener('touchend',function(e){
    if(x0===null) return;
    var dx=e.changedTouches[0].clientX-x0;
    if(Math.abs(dx)>50){ dx<0?next():prev(); }
    x0=null;
  },{passive:true});

  setTimeout(function(){
    var hint=document.getElementById('hint');
    if(hint){ hint.style.opacity='0'; setTimeout(function(){ hint.remove(); },600); }
  }, 3200);

  var m=location.search.match(/[?&]p=(\\d+)/);
  if(m) show(+m[1]-1); else show(0);
})();
</script>
</body>
</html>`;

writeFileSync('slides.html', html, 'utf8');
console.log('=== 幻灯片构建完成 ===');
console.log('  页数：' + deck.length);
console.log('  体积：' + (html.length / 1024).toFixed(1) + ' KB');
console.log('  输出：slides.html');
