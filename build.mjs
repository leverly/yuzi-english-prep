#!/usr/bin/env node
// 北京市西城区初一(上)英语期末 · 考情分析站
// 设计语言沿用数学站：靛蓝渐变主色 / 白卡片 / 大圆角 / 柔和阴影 / 编号卡
// 零依赖、纯静态，产物可直接 file:// 打开
//
// 纪律：页面上的每个数字都从 stats.mjs 派生，不写常量。
// 写不出来源的数字就不写。
import { writeFileSync } from 'node:fs';

import {
  PAPER_STATS, YEARS, N_PAPERS,
  SEG_SCORE, CAT_SCORE, DIFF_SCORE, MODE_SCORE, MODE_BREAKDOWN, WRITE_SEGS,
  FAM_MAP, freqOf, FREQ_RULE, FREQ_SUMMARY,
  STRUCTURE, SEG_FIXED, SEG_VARY, CAT_STABILITY, DIFF_STABILITY,
  CROSS_CHECK,
  SEG_ORDER, SEG_NAME, CAT_ORDER, CAT_NAME, DIFF_ORDER, DIFF_NAME, MODE_NAME,
  PROP_STABILITY, PROP_LEVEL_NAME, PROP_SUMMARY, GRAMMAR_YEARLY,
  SPELL_ITEMS, SPELL_FEATURES, SPELL_STATS, SPELL_SEGMENTS, SPELL_TOTAL,
  GRAMMAR_FAMS, SENT_ITEMS, SENT_ACTIONS, SENT_GROUPS, GRAMMAR_DOUBLE,
  WRITE_ITEMS, WRITE_STATS, WRITE_Q_RANGE, READ_ITEMS, READ_STATS, READ_ANS_TYPES,
} from './work/papers/stats.mjs';
import { LEDGER, CAT_NOTE, FAM_DEFS } from './work/papers/ledger.mjs';

const SITE = {
  short: '西城初一英语',
  name: '西城区初一(上)英语期末 · 考情分析与满分冲刺',
  full: '西城区初一(上)英语期末考情分析站',
  exam: '西城区初一(上)期末',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ============================ 派生量 ============================ */
const MAIN_TOTAL = PAPER_STATS[0].mainTotal;              // 90
const BONUS_TOTAL = PAPER_STATS[0].bonusTotal;            // 10
const SELECT_AVG = MODE_SCORE.select.avg;                 // 54
const WRITE_AVG = MODE_SCORE.write.avg;                   // 36
const SELECT_PCT = MODE_SCORE.select.pct;
const WRITE_PCT = MODE_SCORE.write.pct;

// 输出型板块（由数据派生：该板块全部题目都是 write）
const WRITE_SEG_LIST = WRITE_SEGS.map((k) => ({
  k, name: SEG_NAME[k], score: SEG_SCORE[k].avg, count: PAPER_STATS[0].segN[k] || 0,
}));
const SELECT_SEG_LIST = SEG_ORDER.filter((k) => !WRITE_SEGS.includes(k)).map((k) => ({
  k, name: SEG_NAME[k], score: SEG_SCORE[k].avg, count: PAPER_STATS[0].segN[k] || 0,
}));

// 主排序用分值权重：即使 4 套样本下 18/25 族都是 4/4，分值仍是最稳的区分度。
// 命中次数只作事实列，不单独当排序依据。
const FAM_RANKED = FAM_MAP.filter((f) => !f.onlyBonus);
const TOP_FAM_COUNT = 12;

const BASE_AVG = DIFF_SCORE.easy.avg;
const MID_AVG = DIFF_SCORE.mid.avg;
const HARD_AVG = DIFF_SCORE.hard.avg;
const BASE_MID = +(BASE_AVG + MID_AVG).toFixed(1);
const BASE_MID_PCT = Math.round(((BASE_AVG + MID_AVG) / MAIN_TOTAL) * 100);

const DIFF_INDEX_MIN = Math.min(...PAPER_STATS.map((s) => s.diffIndex));
const DIFF_INDEX_MAX = Math.max(...PAPER_STATS.map((s) => s.diffIndex));

const ALWAYS_N = FREQ_SUMMARY.always.length;
const FAM_N = FAM_RANKED.length;
const RARE_N = FREQ_SUMMARY.rare.filter((f) => !f.onlyBonus).length;
const OFTEN_N = FREQ_SUMMARY.often.length;
// 学年跨度文字由数据派生，不写死「三年」
const SPAN = N_PAPERS;                      // 套数即学年数
const SPAN_CN = ['', '一', '二', '三', '四', '五', '六'][SPAN] || String(SPAN);

/* ============================ 设计系统 ============================ */
const CSS = `
:root{
  --r:16px; --r-sm:10px; --r-lg:22px; --r-pill:999px;
  --max:1140px;
  --ease:cubic-bezier(.22,.61,.36,1);
  --sans:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif;
  --mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;

  --bg:#f6f8fc; --bg-2:#fff; --bg-3:#edf2f9;
  --surface:#fff; --surface-2:#f8fafd;
  --border:rgba(15,23,42,.085); --border-2:rgba(15,23,42,.16);
  --text:#0f172a; --text-2:#475569; --text-3:#64748b;

  --accent:#2563eb; --accent-h:#1d4ed8;
  --accent-soft:rgba(37,99,235,.08); --accent-soft-2:rgba(37,99,235,.14);
  --accent-grad:linear-gradient(135deg,#2563eb 0%,#4f46e5 100%);

  --purple:#7c3aed; --purple-soft:rgba(124,58,237,.09);
  --gold:#d97706; --gold-soft:rgba(245,158,11,.12);
  --gold-grad:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);
  --ok:#059669; --ok-soft:rgba(16,185,129,.10);
  --rose:#e11d48; --rose-soft:rgba(225,29,72,.085);

  --shadow-1:0 1px 2px rgba(15,23,42,.04),0 1px 3px rgba(15,23,42,.03);
  --shadow-2:0 4px 12px -2px rgba(15,23,42,.06),0 2px 4px -1px rgba(15,23,42,.04);
  --shadow-3:0 16px 36px -10px rgba(15,23,42,.11),0 4px 12px -2px rgba(15,23,42,.05);
  --shadow-accent:0 10px 26px -8px rgba(37,99,235,.36);
  --hero-glow:radial-gradient(ellipse 80% 55% at 50% -10%,rgba(37,99,235,.11),transparent 70%);
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{
  font-family:var(--sans); background:var(--bg); color:var(--text);
  line-height:1.68; font-size:15px; overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
a{color:inherit}
.wrap{max-width:var(--max);margin:0 auto;padding:0 24px}

.site-head{
  position:sticky;top:0;z-index:60;
  background:rgba(246,248,252,.86);
  backdrop-filter:saturate(180%) blur(14px);
  border-bottom:1px solid var(--border);
}
.hdr-in{max-width:var(--max);margin:0 auto;padding:0 24px;height:64px;display:flex;align-items:center;gap:14px}
.brand{display:flex;align-items:center;gap:9px;text-decoration:none;font-weight:750;font-size:15px;letter-spacing:-.01em;white-space:nowrap}
.brand-mark{
  width:30px;height:30px;border-radius:9px;background:var(--accent-grad);
  display:grid;place-items:center;color:#fff;font-size:14px;font-weight:800;
  box-shadow:var(--shadow-accent);flex:none;
}
.brand small{font-family:var(--mono);font-size:.68rem;font-weight:600;color:var(--accent);background:var(--accent-soft);padding:2px 6px;border-radius:5px;margin-left:2px}
.hdr-nav{display:flex;gap:2px;margin-left:auto;overflow-x:auto;scrollbar-width:none}
.hdr-nav::-webkit-scrollbar{display:none}
.hdr-nav a{
  padding:7px 13px;border-radius:9px;color:var(--text-2);text-decoration:none;
  font-size:14px;font-weight:550;white-space:nowrap;transition:.16s var(--ease);
}
.hdr-nav a:hover{background:var(--accent-soft);color:var(--accent)}
.hdr-nav a.on{background:var(--accent);color:#fff;font-weight:650;box-shadow:var(--shadow-accent)}
.hdr-nav a.nav-slides{background:var(--purple-soft);color:var(--purple);font-weight:650;display:inline-flex;align-items:center;gap:5px}
.hdr-nav a.nav-slides::before{content:"▶";font-size:9px}
.hdr-nav a.nav-slides:hover{background:var(--purple);color:#fff}
.hdr-nav a.nav-slides.on{background:var(--purple);color:#fff}

.hero{padding:54px 0 30px;position:relative;background:var(--hero-glow)}
.hero-split{display:grid;grid-template-columns:1.12fr .98fr;gap:38px;align-items:start}
.hero-split.wide{grid-template-columns:1.45fr .9fr;gap:44px}
.hero-badge{
  display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;
  color:var(--accent);border:1px solid rgba(37,99,235,.24);background:var(--surface);
  padding:5px 13px;border-radius:var(--r-pill);margin-bottom:20px;box-shadow:var(--shadow-1);
}
.dot-live{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(37,99,235,.16)}
h1{font-size:clamp(28px,3.6vw,42px);line-height:1.22;font-weight:800;letter-spacing:-.03em;margin-bottom:16px}
.accent-word{background:var(--accent-grad);-webkit-background-clip:text;background-clip:text;color:transparent}
.lede{font-size:15.5px;color:var(--text-2);line-height:1.75}
.lede b{color:var(--text);font-weight:650}
.hero-cta{display:flex;gap:10px;margin-top:24px;flex-wrap:wrap}
.btn{
  display:inline-flex;align-items:center;gap:7px;padding:11px 20px;border-radius:11px;
  font-size:14.5px;font-weight:650;text-decoration:none;border:1px solid var(--border-2);
  background:var(--surface);color:var(--text);transition:.18s var(--ease);box-shadow:var(--shadow-1);
}
.btn:hover{transform:translateY(-1px);box-shadow:var(--shadow-2)}
.btn.primary{background:var(--accent-grad);color:#fff;border-color:transparent;box-shadow:var(--shadow-accent)}
.btn.primary:hover{box-shadow:0 14px 30px -8px rgba(37,99,235,.46)}
.hero-trust{display:flex;gap:16px;margin-top:20px;flex-wrap:wrap;font-size:12.8px;color:var(--text-3)}
.hero-trust b{color:var(--ok);margin-right:3px}
.hero-stats{
  display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:0 28px;
  margin-top:24px;padding-top:20px;border-top:1px solid var(--border);
}
.hero-stats>div{display:flex;flex-direction:column;gap:1px;min-width:0}
.hero-stats b{font-size:26px;font-weight:780;letter-spacing:-.03em;line-height:1.15;font-variant-numeric:tabular-nums;white-space:nowrap}
.hero-stats .hs-of{font-size:13px;font-weight:650;color:var(--text-3);margin-left:1px}
.hero-stats span{font-size:12px;color:var(--text-3)}

.cockpit{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);
  padding:22px;box-shadow:var(--shadow-3);position:relative;overflow:hidden;
}
.cockpit::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:var(--accent-grad)}
.cockpit-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;flex-wrap:wrap}
.level-pill{font-size:12px;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:4px 11px;border-radius:var(--r-pill)}
.metric-row{display:flex;align-items:baseline;gap:11px;padding:12px 0;border-bottom:1px solid var(--border)}
.metric-row:last-of-type{border-bottom:none}
.metric-row .mv{font-size:25px;font-weight:780;letter-spacing:-.03em;font-variant-numeric:tabular-nums;min-width:54px}
.metric-row .mv.accent{color:var(--accent)}
.metric-row .mv.gold{color:var(--gold)}
.metric-row .mv.ok{color:var(--ok)}
.metric-row .mv.rose{color:var(--rose)}
.metric-row .ml{font-size:12.5px;color:var(--text-2);line-height:1.45}
.metric-row .ml b{display:block;color:var(--text);font-weight:650;font-size:13.5px}
.mission-list{margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:5px}
.mission-item{
  display:flex;align-items:center;gap:11px;padding:10px 11px;border-radius:11px;
  text-decoration:none;color:var(--text);transition:.16s var(--ease);
}
.mission-item:hover{background:var(--surface-2)}
.mi-ico{width:32px;height:32px;border-radius:9px;display:grid;place-items:center;font-size:15px;flex:none}
.mi-ico.blue{background:var(--accent-soft)}
.mi-ico.purple{background:var(--purple-soft)}
.mi-ico.gold{background:var(--gold-soft)}
.mi-ico.rose{background:var(--rose-soft)}
.mi-main{display:flex;flex-direction:column;line-height:1.4;min-width:0}
.mi-main b{font-size:13.5px;font-weight:650}
.mi-main small{font-size:11.8px;color:var(--text-3)}
.mi-go{margin-left:auto;font-size:12px;font-weight:600;color:var(--accent);white-space:nowrap}

.section{margin:54px 0}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.section-head-left{min-width:0}
.kicker{
  font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;
  color:var(--accent);font-weight:600;margin-bottom:8px;display:block;
}
h2{font-size:clamp(21px,2.4vw,27px);font-weight:780;letter-spacing:-.025em;line-height:1.3}
.sub{font-size:13.2px;color:var(--text-3);display:block;margin-top:6px}
h3{font-size:16px;font-weight:700;letter-spacing:-.01em;margin-bottom:10px}

.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:22px;box-shadow:var(--shadow-1)}
.card+.card{margin-top:14px}
.grid{display:grid;gap:14px}
.g2{grid-template-columns:repeat(2,1fr)}
.g3{grid-template-columns:repeat(3,1fr)}
.g4{grid-template-columns:repeat(4,1fr)}

.sell-rows{display:flex;flex-direction:column;gap:12px}
.sell-row{
  display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);gap:0;
  border:1px solid var(--border);border-radius:var(--r);background:var(--surface);
  overflow:hidden;transition:.18s var(--ease);
}
.sell-row:hover{border-color:rgba(37,99,235,.3);box-shadow:var(--shadow-2)}
.sell-pain{padding:22px 24px;background:var(--bg-3);display:flex;flex-direction:column;gap:7px;position:relative}
.sell-no{font-family:var(--mono);font-size:.72rem;font-weight:700;letter-spacing:.1em;color:var(--accent);opacity:.75}
.sell-pain b{font-size:15px;font-weight:700;line-height:1.45;letter-spacing:-.01em}
.sell-pain-sub{font-size:12.8px;color:var(--text-3)}
.sell-fix{padding:22px 24px;display:flex;flex-direction:column;gap:9px}
.sell-tag{
  align-self:flex-start;font-size:.7rem;font-weight:800;padding:3px 10px;border-radius:var(--r-pill);
  background:var(--accent-soft);color:var(--accent);letter-spacing:.02em;
}
.sell-fix p{font-size:13.6px;color:var(--text-2);line-height:1.72}
.sell-fix p b{color:var(--text);font-weight:650}
.sell-link{font-size:13px;font-weight:650;color:var(--accent);text-decoration:none;margin-top:auto}
.sell-link:hover{text-decoration:underline}

.tier-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.tier-card{
  display:block;text-decoration:none;color:var(--text);background:var(--surface);
  border:1px solid var(--border);border-radius:var(--r);padding:18px 20px;box-shadow:var(--shadow-1);
  transition:.18s var(--ease);position:relative;overflow:hidden;
}
.tier-card::before{content:"";position:absolute;inset:0 auto 0 0;width:4px}
.tier-card.t-blue::before{background:var(--accent)}
.tier-card.t-gold::before{background:var(--gold)}
.tier-card.t-rose::before{background:var(--rose)}
.tier-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.tier-n{font-size:31px;font-weight:800;letter-spacing:-.035em;line-height:1.1;font-variant-numeric:tabular-nums}
.tier-card.t-blue .tier-n{color:var(--accent)}
.tier-card.t-gold .tier-n{color:var(--gold)}
.tier-card.t-rose .tier-n{color:var(--rose)}
.tier-n small{font-size:14px;font-weight:650;color:var(--text-3);margin-left:2px}
.tier-l{font-size:13px;font-weight:650;margin-top:5px}
.tier-d{font-size:12.4px;color:var(--text-3);margin-top:3px;line-height:1.55}
.tier-goal{font-size:12px;font-weight:700;color:var(--accent);margin-top:10px;padding-top:9px;border-top:1px solid var(--border)}

.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:var(--r);border:1px solid var(--border);background:var(--surface)}
table{width:100%;border-collapse:collapse;font-size:13.4px}
th,td{padding:11px 13px;text-align:left;border-bottom:1px solid var(--border);white-space:nowrap}
th{font-size:11.5px;font-weight:700;color:var(--text-3);letter-spacing:.04em;background:var(--surface-2);border-bottom:1px solid var(--border-2)}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
tbody tr:hover{background:var(--surface-2)}
tbody tr:last-child td{border-bottom:none}
tfoot td{font-weight:700;border-top:2px solid var(--border-2);border-bottom:none;background:var(--bg-3)}
.cell-hi{color:var(--accent);font-weight:700}
td.wrap-cell{white-space:normal;min-width:180px}

.tag{display:inline-block;font-size:11.5px;font-weight:650;padding:2.5px 8px;border-radius:6px;line-height:1.55;white-space:nowrap}
.tag.must{background:var(--rose-soft);color:var(--rose)}
.tag.often{background:var(--gold-soft);color:var(--gold)}
.tag.rare{background:var(--bg-3);color:var(--text-3)}
.tag.easy{background:var(--ok-soft);color:var(--ok)}
.tag.mid{background:var(--accent-soft);color:var(--accent)}
.tag.hard{background:var(--gold-soft);color:var(--gold)}
.tag.bonus{background:var(--purple-soft);color:var(--purple)}
.tag.ch{background:var(--accent-soft);color:var(--accent)}
.tag.cat{background:var(--bg-3);color:var(--text-2)}
.tag.write{background:var(--rose-soft);color:var(--rose)}
.tag.select{background:var(--accent-soft);color:var(--accent)}

.dist-row{display:grid;grid-template-columns:130px 1fr 96px;align-items:center;gap:12px;padding:7px 0}
.dist-name{font-size:13.4px;font-weight:600;color:var(--text)}
.dist-bar-wrap{display:block;height:8px;background:var(--bg-3);border-radius:var(--r-pill);overflow:hidden}
.dist-bar{display:block;height:100%;background:var(--accent-grad);border-radius:var(--r-pill)}
.dist-bar.gold{background:var(--gold-grad)}
.dist-bar.ok{background:linear-gradient(135deg,#10b981,#059669)}
.dist-bar.rose{background:linear-gradient(135deg,#f43f5e,#e11d48)}
.dist-val{font-size:12.8px;color:var(--text-2);text-align:right;font-variant-numeric:tabular-nums;font-weight:600}

.fam{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
  padding:17px 19px;box-shadow:var(--shadow-1);transition:.18s var(--ease);
}
.fam:hover{border-color:rgba(37,99,235,.28);box-shadow:var(--shadow-2)}
.fam-head{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:7px}
.fam-name{font-size:15px;font-weight:700;letter-spacing:-.01em}
.fam-score{font-size:12.6px;color:var(--text-3);font-variant-numeric:tabular-nums;margin-left:auto}
.fam-meta{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;font-size:11.5px;color:var(--text-3);align-items:center}
.fam-note{font-size:12.9px;color:var(--text-2);line-height:1.65}
.fam-years{display:flex;gap:4px;margin-top:10px;flex-wrap:wrap}
.yr{font-size:11px;padding:2px 6px;border-radius:5px;background:var(--bg-3);color:var(--text-3);font-variant-numeric:tabular-nums}
.yr.hit{background:var(--accent-soft);color:var(--accent);font-weight:650}

.note{
  border-left:3px solid var(--accent);background:var(--accent-soft);
  padding:14px 18px;border-radius:0 var(--r-sm) var(--r-sm) 0;
  font-size:13.6px;color:var(--text-2);line-height:1.72;
}
.note b{color:var(--text)}
.note.warn{border-color:var(--gold);background:var(--gold-soft)}
.note.info{border-color:var(--accent);background:var(--accent-soft)}
.note.risk{border-color:var(--rose);background:var(--rose-soft)}
.note+.note{margin-top:10px}

ul.clean{list-style:none}
ul.clean li{position:relative;padding-left:20px;margin:9px 0;font-size:13.8px;color:var(--text-2);line-height:1.72}
ul.clean li::before{content:"";position:absolute;left:5px;top:9px;width:5px;height:5px;border-radius:50%;background:var(--accent)}
ul.clean li b{color:var(--text);font-weight:650}

.pri{
  background:var(--surface);border:1px solid var(--border);border-radius:var(--r);
  padding:19px 21px;box-shadow:var(--shadow-1);position:relative;overflow:hidden;
  transition:.18s var(--ease);
}
.pri:hover{box-shadow:var(--shadow-2)}
.pri::before{content:"";position:absolute;inset:0 auto 0 0;width:3px;background:var(--accent)}
.pri.p2::before{background:var(--purple)}
.pri.p3::before{background:var(--ok)}
.pri.p4::before{background:var(--gold)}
.pri.p5::before{background:var(--text-3)}
.pri-rank{font-family:var(--mono);font-size:.68rem;font-weight:700;letter-spacing:.09em;color:var(--accent);display:block;margin-bottom:7px}
.pri.p2 .pri-rank{color:var(--purple)}
.pri.p3 .pri-rank{color:var(--ok)}
.pri.p4 .pri-rank{color:var(--gold)}
.pri.p5 .pri-rank{color:var(--text-3)}
.pri h3{margin:0 0 7px;font-size:15px;font-weight:700}
.pri .meta{font-size:12.3px;color:var(--text-3);margin-bottom:10px;font-variant-numeric:tabular-nums;padding-bottom:9px;border-bottom:1px solid var(--border)}
.pri p{font-size:13.3px;color:var(--text-2);line-height:1.72}
.pri p b{color:var(--text);font-weight:650}

.phase{display:grid;grid-template-columns:104px 1fr;border:1px solid var(--border);background:var(--surface);overflow:hidden}
.phase:first-of-type{border-radius:var(--r) var(--r) 0 0}
.phase:last-of-type{border-radius:0 0 var(--r) var(--r)}
.phase+.phase{border-top:none}
.phase-w{
  background:var(--bg-3);padding:16px 13px;font-size:12.2px;font-weight:700;color:var(--accent);
  border-right:1px solid var(--border);display:flex;align-items:center;white-space:nowrap;
}
.phase-b{padding:16px 18px}
.phase-b h4{font-size:14px;font-weight:700;margin-bottom:5px}
.phase-b p{font-size:13.2px;color:var(--text-2);line-height:1.65}
.phase-ok{font-size:12.2px;color:var(--ok);margin-top:8px;font-weight:650}

/* 分层导航：面包屑 / 一级切换 / 二级切换 */
.crumb{display:flex;align-items:center;gap:7px;font-size:12.6px;color:var(--text-3);margin-bottom:16px;flex-wrap:wrap}
.crumb a{color:var(--text-2);text-decoration:none;font-weight:550}
.crumb a:hover{color:var(--accent);text-decoration:underline}
.crumb .sep{opacity:.45}
.crumb b{color:var(--text);font-weight:650}
.subtabs{
  display:flex;gap:6px;flex-wrap:wrap;margin-bottom:26px;padding:5px;
  background:var(--surface);border:1px solid var(--border);border-radius:13px;box-shadow:var(--shadow-1);
}
.subtabs a{
  display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:9px;
  text-decoration:none;color:var(--text-2);font-size:13.6px;font-weight:600;
  transition:.16s var(--ease);white-space:nowrap;
}
.subtabs a:hover{background:var(--bg-3);color:var(--text)}
.subtabs a.on{background:var(--accent);color:#fff;box-shadow:var(--shadow-accent)}
.subtabs a .sn{font-family:var(--mono);font-size:11px;opacity:.72}
.subtabs a.on .sn{opacity:.85}
.subtabs.sub{margin:-14px 0 26px;padding:0;background:transparent;border:none;box-shadow:none;gap:8px}
.subtabs.sub a{border:1px solid var(--border);background:var(--surface);padding:7px 14px;font-size:13px}
.subtabs.sub a:hover{background:var(--surface-2)}
.subtabs.sub a.on{background:var(--purple);border-color:transparent;color:#fff;box-shadow:0 8px 20px -8px rgba(124,58,237,.42)}

/* 总览页的四部分入口卡 */
.part-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.part-card{
  display:flex;flex-direction:column;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--r);padding:22px 24px;box-shadow:var(--shadow-1);
  transition:.18s var(--ease);position:relative;overflow:hidden;
}
.part-card::before{content:"";position:absolute;inset:0 auto 0 0;width:4px;background:var(--accent)}
.part-card.p-grammar::before{background:var(--purple)}
.part-card.p-read::before{background:var(--rose)}
.part-card.p-write::before{background:var(--gold)}
.part-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.part-head{display:flex;align-items:baseline;gap:10px;margin-bottom:4px}
.part-n{font-family:var(--mono);font-size:13px;font-weight:700;color:var(--accent);opacity:.8}
.part-card.p-grammar .part-n{color:var(--purple)}
.part-card.p-read .part-n{color:var(--rose)}
.part-card.p-write .part-n{color:var(--gold)}
.part-title{font-size:18px;font-weight:750;letter-spacing:-.015em}
.part-score{margin-left:auto;font-size:13px;font-weight:700;color:var(--text-2);font-variant-numeric:tabular-nums;white-space:nowrap}
.part-how{font-size:13.2px;color:var(--text-2);line-height:1.7;margin:8px 0 14px}
.part-how b{color:var(--text);font-weight:650}
.part-links{display:flex;flex-direction:column;gap:6px;margin-top:auto}
.part-link{
  display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:9px;
  background:var(--surface-2);border:1px solid var(--border);
  text-decoration:none;color:var(--text);font-size:13.2px;font-weight:600;transition:.16s var(--ease);
}
.part-link:hover{background:var(--accent-soft);border-color:rgba(37,99,235,.28);color:var(--accent)}
.part-link .pl-go{margin-left:auto;font-size:12px;color:var(--accent);font-weight:650}
.part-link small{font-size:11.8px;color:var(--text-3);font-weight:500}

/* 紧凑的分值构成：不占一屏，不把 hero 撑高 */
.seg-list{display:flex;flex-direction:column;gap:1px;margin-top:12px}
.seg-row{display:flex;align-items:baseline;gap:9px;padding:7px 0;border-bottom:1px solid var(--border);font-size:12.8px}
.seg-row:last-child{border-bottom:none}
.seg-row .sr-n{font-size:15px;font-weight:750;font-variant-numeric:tabular-nums;min-width:26px;color:var(--accent)}
.seg-row .sr-l{color:var(--text-2);font-weight:550}
.seg-row .sr-c{margin-left:auto;color:var(--text-3);font-size:11.8px;white-space:nowrap}
.hero-metric{display:flex;align-items:baseline;gap:10px;margin-bottom:6px}
.hero-metric .hm-n{font-size:34px;font-weight:780;letter-spacing:-.035em;line-height:1.1;font-variant-numeric:tabular-nums}
.hero-metric .hm-l{font-size:12.6px;color:var(--text-3);line-height:1.4}

footer{margin-top:60px;padding:30px 0 40px;border-top:1px solid var(--border);font-size:12.5px;color:var(--text-3)}
footer p{margin:5px 0}
footer b{color:var(--text-2)}

@media(max-width:960px){
  .hero-split,.hero-split.wide{grid-template-columns:1fr;gap:26px}
  .g3,.g4,.tier-grid{grid-template-columns:repeat(2,1fr)}
  .part-grid{grid-template-columns:1fr}
}
@media(max-width:680px){
  body{font-size:14.5px}
  .wrap,.hdr-in{padding:0 16px}
  .hdr-in{height:58px}
  .brand small{display:none}
  .hero{padding:34px 0 22px}
  .hero-stats{grid-template-columns:repeat(2,1fr);gap:12px 0}
  .hero-stats b{font-size:22px}
  .g2,.g3,.g4,.tier-grid{grid-template-columns:1fr}
  .sell-row{grid-template-columns:1fr}
  .section{margin:38px 0}
  .card{padding:17px}
  .cockpit{padding:18px}
  .dist-row{grid-template-columns:100px 1fr 76px;gap:9px}
  table{font-size:12.4px}
  /* 分层导航在窄屏上要能横滑，不能撑破页面 */
  .subtabs{padding:4px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .subtabs::-webkit-scrollbar{display:none}
  .subtabs a{padding:8px 12px;font-size:13px;flex:none}
  .subtabs.sub{overflow-x:auto;flex-wrap:nowrap}
  .part-grid{gap:12px}
  .part-card{padding:18px}
  .crumb{font-size:12px;margin-bottom:12px}
  /* 窄屏防溢出：h1 与 hero 内的长串不换行会撑破视口 */
  h1{font-size:clamp(22px,6.4vw,28px);overflow-wrap:break-word}
  .lede,.part-how{overflow-wrap:break-word}
  .hero-split,.hero-split.wide{min-width:0}
  .hero-split>div,.hero-split>aside{min-width:0}
  main.wrap{overflow-x:hidden}
  th,td{padding:8px 9px}
  .phase{grid-template-columns:1fr}
  .phase-w{border-right:none;border-bottom:1px solid var(--border)}
  .pri{padding:16px 18px}
}
`;

/* ============================ 公共片段 ============================ */
const NAV = [
  ['index.html', '总览'],
  ['papers.html', '逐年真题'],
  ['trend.html', '趋势与考点'],
  ['special.html', '专项复习'],
  ['slides.html', '演示', 'nav-slides'],
];

// 专项复习的分层结构：一级 = 四个部分，二级只在语法下面。
// 导航「专项复习」始终指向 special.html（总览），子页靠面包屑与二级切换互通。
const SPECIAL_PARTS = [
  { id: 'word', file: 'special-word.html', n: '①', title: '单词', label: '单词' },
  { id: 'grammar', file: 'special-grammar.html', n: '②', title: '语法', label: '语法' },
  { id: 'read', file: 'special-read.html', n: '③', title: '阅读', label: '阅读' },
  { id: 'write', file: 'special-write.html', n: '④', title: '写作', label: '写作' },
];
const GRAMMAR_SUBS = [
  { id: 'fam', file: 'special-grammar-fam.html', label: '单选语法族' },
  { id: 'sent', file: 'special-grammar-sent.html', label: '汉译英' },
];

// 专项子页的二级切换条（只在四个部分页上出现）
function specialTabs(activePart) {
  return `<div class="subtabs">
  <a href="special.html" class="${activePart ? '' : 'on'}">专项总览</a>
  ${SPECIAL_PARTS.map((p) => `<a href="${p.file}" class="${p.id === activePart ? 'on' : ''}"><span class="sn">${p.n}</span>${p.label}</a>`).join('')}
</div>`;
}

// 语法两个子页的三级切换条
function grammarTabs(activeSub) {
  return `<div class="subtabs sub">
  ${GRAMMAR_SUBS.map((s) => `<a href="${s.file}" class="${s.id === activeSub ? 'on' : ''}">${s.label}</a>`).join('')}
</div>`;
}

const crumb = (items) => `<div class="crumb">${items
  .map((it, i) => (i === items.length - 1 ? `<b>${it.label}</b>` : `<a href="${it.href}">${it.label}</a><span class="sep">/</span>`))
  .join('')}</div>`;

function page(active, title, desc, body) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<style>${CSS}</style>
</head>
<body>
<header class="site-head"><div class="hdr-in">
  <a class="brand" href="index.html">
    <span class="brand-mark">英</span>
    <span>${esc(SITE.short)}<small>初一上·期末</small></span>
  </a>
  <nav class="hdr-nav">
    ${NAV.map(([h, t, cls]) => `<a href="${h}" class="${[h === active ? 'on' : '', cls || ''].filter(Boolean).join(' ')}">${t}</a>`).join('')}
  </nav>
</div></header>
<main class="wrap">
${body}
</main>
<footer class="wrap">
  <p><b>${esc(SITE.full)}</b> · 样本：西城区 ${YEARS.join(' / ')} ${N_PAPERS} 套期末真题，共 ${LEDGER.length} 题逐题标注</p>
  <p>所有统计数字由逐题台账派生，非人工填写。频次结论基于 ${N_PAPERS} 套样本，不构成押题。</p>
</footer>
</body>
</html>`;
}

const section = (kicker, title, sub, content, id = '') => `
<section class="section"${id ? ` id="${id}"` : ''}>
  <div class="section-head"><div class="section-head-left">
    <span class="kicker">${kicker}</span>
    <h2>${title}</h2>
    ${sub ? `<span class="sub">${sub}</span>` : ''}
  </div></div>
  ${content}
</section>`;

const distBar = (name, val, max, unit, cls = '') => {
  const w = max > 0 ? Math.round((val / max) * 100) : 0;
  return `<div class="dist-row">
    <span class="dist-name">${esc(name)}</span>
    <span class="dist-bar-wrap"><span class="dist-bar ${cls}" style="width:${w}%"></span></span>
    <span class="dist-val">${fmt(val)}${unit}</span>
  </div>`;
};

/* ============================ 首页 ============================ */
function buildHome() {
  const topFams = FAM_RANKED.slice(0, TOP_FAM_COUNT);

  const body = `
<section class="hero">
  <div class="hero-split">
    <div>
      <div class="hero-badge"><span class="dot-live"></span>西城区区统考 · ${N_PAPERS} 套真题逐题拆解</div>
      <h1>丢分的不是不会，<br><span class="accent-word">是写不对</span></h1>
      <p class="lede">
        必做 ${MAIN_TOTAL} 分里，<b>${fmt(SELECT_AVG)} 分只要涂卡</b>，剩下 <b>${fmt(WRITE_AVG)} 分必须写出文字</b>——
        听写、简答、音标、汉译英、作文。这${SPAN_CN}年的卷子结构一动没动，所以分数差距几乎全在<b>输出端的形式准确性</b>上。
      </p>
      <div class="hero-cta">
        <a class="btn primary" href="trend.html">先看${SPAN_CN}年趋势</a>
        <a class="btn" href="special.html">看专项复习</a>
      </div>
      <div class="hero-trust">
        <span><b>✓</b>${N_PAPERS} 套卷逐题标注</span>
        <span><b>✓</b>十个板块分值逐年一致</span>
        <span><b>✓</b>数字全部派生自台账</span>
      </div>
      <div class="hero-stats">
        <div><b>${MAIN_TOTAL}</b><span>必做满分</span></div>
        <div><b>${PAPER_STATS[0].mainCount}</b><span>必做小题</span></div>
        <div><b>${BONUS_TOTAL}</b><span>选做满分</span></div>
        <div><b>100</b><span>分钟</span></div>
      </div>
    </div>

    <aside class="cockpit">
      <div class="cockpit-top">
        <span class="level-pill">卷面结构 · ${N_PAPERS} 套一致</span>
      </div>
      <div class="metric-row">
        <span class="mv accent">${fmt(SELECT_AVG)}</span>
        <span class="ml"><b>选择型 ${SELECT_PCT}%</b>听选 + 单选 + 完形 + 阅读选择，只涂卡</span>
      </div>
      <div class="metric-row">
        <span class="mv rose">${fmt(WRITE_AVG)}</span>
        <span class="ml"><b>输出型 ${WRITE_PCT}%</b>听填 + 简答 + 音标 + 汉译英 + 作文，要写出来</span>
      </div>
      <div class="metric-row">
        <span class="mv gold">${fmt(BASE_MID)}</span>
        <span class="ml"><b>基础 + 中档 ${BASE_MID_PCT}%</b>较难仅 ${fmt(HARD_AVG)} 分</span>
      </div>
      <div class="metric-row">
        <span class="mv ok">${BONUS_TOTAL}</span>
        <span class="ml"><b>选做缓冲垫</b>计入总分，可抵必做 10 分内失误</span>
      </div>
      <div class="mission-list">
        <a class="mission-item" href="papers.html">
          <span class="mi-ico blue">📄</span>
          <span class="mi-main"><b>逐年真题</b><small>${N_PAPERS} 套卷逐题台账</small></span>
          <span class="mi-go">查看 →</span>
        </a>
        <a class="mission-item" href="trend.html">
          <span class="mi-ico purple">📈</span>
          <span class="mi-main"><b>趋势与考点</b><small>${FAM_RANKED.length} 个考点族权重</small></span>
          <span class="mi-go">查看 →</span>
        </a>
        <a class="mission-item" href="special.html">
          <span class="mi-ico rose">📝</span>
          <span class="mi-main"><b>专项复习</b><small>单词 / 语法 / 阅读 / 写作 四页</small></span>
          <span class="mi-go">查看 →</span>
        </a>
      </div>
    </aside>
  </div>
</section>

${section('核心判断', '三个判断，决定复习顺序', '每条都能追到下面这张分值表', `
<div class="sell-rows">
  <div class="sell-row">
    <div class="sell-pain">
      <span class="sell-no">判断 01</span>
      <b>结构${SPAN_CN}年零变化，所以按板块复习成立</b>
      <span class="sell-pain-sub">但题号不可互认</span>
    </div>
    <div class="sell-fix">
      <span class="sell-tag">证据</span>
      <p>必做 <b>${MAIN_TOTAL} 分 / ${PAPER_STATS[0].mainCount} 小题</b>、十个板块分值、选做 ${BONUS_TOTAL} 分，${N_PAPERS} 套卷逐年完全一致（${SEG_FIXED.length}/${SEG_ORDER.length} 个板块极差为 0）。</p>
      <p>但 <b>2024-25 的单选从第 1 题重新编号</b>，另两套是连续编号——背「第 13 题考代词」会失手，要按板块识别。</p>
      <a class="sell-link" href="trend.html#stability">看结构稳定性 →</a>
    </div>
  </div>
  <div class="sell-row">
    <div class="sell-pain">
      <span class="sell-no">判断 02</span>
      <b>${fmt(WRITE_AVG)} 分要写出来，这才是主战场</b>
      <span class="sell-pain-sub">输出型占卷面 ${WRITE_PCT}%</span>
    </div>
    <div class="sell-fix">
      <span class="sell-tag">证据</span>
      <p>${WRITE_SEG_LIST.map((s) => `${s.name} ${fmt(s.score)}`).join(' + ')} = <b>${fmt(WRITE_AVG)} 分</b>。</p>
      <p>这 ${fmt(WRITE_AVG)} 分丢的不是「不会」，是<b>三单忘加 s、过去时写原形、简答照抄原句人称没换、音标认识但拼错</b>。补救动作与多刷题无关。</p>
      <a class="sell-link" href="special.html">看输出端怎么练 →</a>
    </div>
  </div>
  <div class="sell-row">
    <div class="sell-pain">
      <span class="sell-no">判断 03</span>
      <b>难度不在压轴，在中档</b>
      <span class="sell-pain-sub">较难只占 ${DIFF_SCORE.hard.pct}%</span>
    </div>
    <div class="sell-fix">
      <span class="sell-tag">证据</span>
      <p>基础 ${fmt(BASE_AVG)} 分 + 中档 ${fmt(MID_AVG)} 分 = <b>${fmt(BASE_MID)} 分（${BASE_MID_PCT}%）</b>；较难 ${fmt(HARD_AVG)} 分（${DIFF_SCORE.hard.pct}%）。</p>
      <p>难度指数${SPAN_CN}年在 ${DIFF_INDEX_MIN}–${DIFF_INDEX_MAX} 之间（1=全基础，3=全较难），几乎没有波动。所以<b>不必押难题，要把中档题的准确率做满</b>。</p>
      <a class="sell-link" href="papers.html#diff">看难度分布 →</a>
    </div>
  </div>
</div>
`)}

${section('分值分区', `${MAIN_TOTAL} 分不是均匀分布的`, `按「要不要写出文字」切开，这是全站最重要的一刀`, `
<div class="tier-grid">
  <a class="tier-card t-blue" href="trend.html#mode">
    <div class="tier-n">${fmt(SELECT_AVG)}<small>分</small></div>
    <div class="tier-l">选择型 · ${SELECT_PCT}%</div>
    <div class="tier-d">${SELECT_SEG_LIST.map((s) => s.name).join('、')}</div>
    <div class="tier-goal">只涂卡，认得出就得分</div>
  </a>
  <a class="tier-card t-rose" href="trend.html#mode">
    <div class="tier-n">${fmt(WRITE_AVG)}<small>分</small></div>
    <div class="tier-l">输出型 · ${WRITE_PCT}%</div>
    <div class="tier-d">${WRITE_SEG_LIST.map((s) => s.name).join('、')}</div>
    <div class="tier-goal">要写对形式，这里才是提分空间</div>
  </a>
  <a class="tier-card t-gold" href="trend.html#bonus">
    <div class="tier-n">${BONUS_TOTAL}<small>分</small></div>
    <div class="tier-l">选做 · 缓冲垫</div>
    <div class="tier-d">计入总分，但卷面封顶 ${MAIN_TOTAL} 分</div>
    <div class="tier-goal">能抵必做 10 分内失误，补不回更多</div>
  </a>
</div>

<div class="note info" style="margin-top:16px">
  <b>为什么这条比「哪些知识点常考」更重要：</b>${SPAN_CN}个学年里，${FAM_N} 个考点族有 <b>${ALWAYS_N} 个 ${N_PAPERS}/${N_PAPERS} 年都考</b>，
  另有 ${OFTEN_N} 个 ${FREQ_RULE.often}/${N_PAPERS} 年、${RARE_N} 个更少。但「都考」不等于「都值钱」——
  ${ALWAYS_N} 个族的年均分从 ${fmt(FAM_RANKED[0].avgPerYear)} 分到 ${fmt(FAM_RANKED[ALWAYS_N-1]?.avgPerYear ?? FAM_RANKED[FAM_RANKED.length-1].avgPerYear)} 分不等。
  <b>所以主排序用分值权重，命中次数只作事实列。</b>
</div>
`)}

${section('分值权重', `分值最高的 ${TOP_FAM_COUNT} 个考点族`, '按年均分值降序；命中次数只作事实列', `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>考点族</th><th class="num">年均分</th><th class="num">占卷面</th><th>命中</th><th>作答</th><th>说明</th>
</tr></thead>
<tbody>
${topFams.map((f) => {
  const pctOfPaper = Math.round((f.avgPerYear / MAIN_TOTAL) * 100);
  const isWrite = f.qs.length > 0 && f.qs.every((q) => q.mode === 'write');
  return `<tr>
  <td><b>${esc(f.name)}</b></td>
  <td class="num cell-hi">${fmt(f.avgPerYear)}</td>
  <td class="num">${pctOfPaper}%</td>
  <td><span class="yr ${f.hit === N_PAPERS ? 'hit' : ''}">${f.hit}/${N_PAPERS}</span></td>
  <td><span class="tag ${isWrite ? 'write' : 'select'}">${isWrite ? '输出' : '选择'}</span></td>
  <td class="wrap-cell" style="color:var(--text-3);font-size:12.6px">${esc(f.note)}</td>
</tr>`;
}).join('')}
</tbody>
</table>
</div>
<div class="note" style="margin-top:16px">
  前 ${TOP_FAM_COUNT} 族合计年均 <b>${fmt(sum(topFams.map((f) => f.avgPerYear)))} 分</b>，
  占必做 ${MAIN_TOTAL} 分的 <b>${Math.round((sum(topFams.map((f) => f.avgPerYear)) / MAIN_TOTAL) * 100)}%</b>。
  完整 ${FAM_RANKED.length} 族见 <a href="trend.html#fam" style="color:var(--accent);font-weight:650">趋势与考点</a>。
</div>
`)}
`;

  return page('index.html', SITE.name, `西城区初一(上)英语期末 ${N_PAPERS} 套真题考情分析：必做 ${MAIN_TOTAL} 分里 ${fmt(WRITE_AVG)} 分要写出文字。`, body);
}

/* ============================ 逐年真题 ============================ */
function buildPapers() {
  // ① 板块分值表（逐年 + 均值）
  const segTable = `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>板块</th>
  ${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th class="num">年均</th><th class="num">占卷面</th><th>作答</th>
</tr></thead>
<tbody>
${SEG_ORDER.map((k) => {
  const s = SEG_SCORE[k];
  const isWrite = WRITE_SEGS.includes(k);
  return `<tr>
  <td><b>${esc(s.name)}</b></td>
  ${s.per.map((v) => `<td class="num">${fmt(v)}</td>`).join('')}
  <td class="num cell-hi">${fmt(s.avg)}</td>
  <td class="num">${s.pct}%</td>
  <td><span class="tag ${isWrite ? 'write' : 'select'}">${isWrite ? '输出' : '选择'}</span></td>
</tr>`;
}).join('')}
</tbody>
<tfoot><tr>
  <td>必做合计</td>
  ${PAPER_STATS.map((p) => `<td class="num">${p.mainTotal}</td>`).join('')}
  <td class="num">${MAIN_TOTAL}</td><td class="num">100%</td><td></td>
</tr></tfoot>
</table>
</div>`;

  // ② 能力分值
  const catBars = CAT_ORDER.map((k) => distBar(CAT_NAME[k], CAT_SCORE[k].avg, MAIN_TOTAL, ' 分')).join('');

  // ③ 难度分布
  const diffBars = DIFF_ORDER.map((k) => {
    const cls = k === 'easy' ? 'ok' : k === 'mid' ? '' : 'rose';
    return distBar(DIFF_NAME[k], DIFF_SCORE[k].avg, MAIN_TOTAL, ' 分', cls);
  }).join('');

  // ④ 考点族（按板块分组）
  const famBySeg = SEG_ORDER.map((seg) => {
    const fams = FAM_RANKED.filter((f) => f.seg.includes(seg)).sort((a, b) => b.total - a.total);
    return { seg, name: SEG_NAME[seg], fams, total: sum(fams.map((f) => f.total)) };
  }).filter((g) => g.fams.length);

  const famCloud = famBySeg.map((g) => `
<div class="card" style="margin-bottom:12px">
  <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px;flex-wrap:wrap">
    <h3 style="margin:0">${esc(g.name)}</h3>
    <span style="font-size:12.3px;color:var(--text-3)">${g.fams.length} 族 · ${SPAN_CN}年合计 ${fmt(g.total)} 分</span>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px">
  ${g.fams.map((f) => {
    const size = Math.round(11 + Math.sqrt(f.total) * 1.9);
    const color = f.hit === N_PAPERS ? 'var(--accent)' : f.hit >= FREQ_RULE.often ? 'var(--ok)' : 'var(--gold)';
    return `<span class="fam-chip" data-tip="${esc(f.name)}｜年均 ${fmt(f.avgPerYear)} 分｜${f.hit}/${N_PAPERS} 年"
      style="font-size:${size}px;color:${color};background:${f.hit === N_PAPERS ? 'var(--accent-soft)' : f.hit >= FREQ_RULE.often ? 'var(--ok-soft)' : 'var(--gold-soft)'};padding:4px 11px;border-radius:var(--r-pill);font-weight:650;cursor:default">${esc(f.name)}</span>`;
  }).join('')}
  </div>
</div>`).join('');

  // ⑤ 逐卷明细卡
  const paperCards = PAPER_STATS.map((p) => {
    const qs = LEDGER.filter((q) => q.p === p.id);
    const main = qs.filter((q) => !q.bonus);
    const bonus = qs.filter((q) => q.bonus);
    const segRows = SEG_ORDER.filter((k) => p.seg[k]).map((k) => {
      const isWrite = WRITE_SEGS.includes(k);
      return `<tr>
        <td>${esc(SEG_NAME[k])}</td>
        <td class="num">${fmt(p.seg[k])}</td>
        <td class="num">${p.segN[k]}</td>
        <td><span class="tag ${isWrite ? 'write' : 'select'}">${isWrite ? '输出' : '选择'}</span></td>
      </tr>`;
    }).join('');

    return `
<div class="card" style="margin-bottom:14px">
  <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px">
    <h3 style="margin:0;font-size:19px">${esc(p.year)}</h3>
    <span class="tag ${p.hasAnswer ? 'easy' : 'rare'}">${p.hasAnswer ? '有答案' : '无答案'}</span>
    <span style="font-size:12.4px;color:var(--text-3)">${esc(p.answerSource)}</span>
    <span style="margin-left:auto;font-size:12.4px;color:var(--text-3)">难度指数 <b style="color:var(--accent)">${p.diffIndex}</b></span>
  </div>
  <div class="grid g2" style="gap:18px">
    <div>
      <div style="font-size:12.2px;font-weight:700;color:var(--text-3);letter-spacing:.04em;margin-bottom:8px">板块分值</div>
      <div class="tbl-wrap"><table style="font-size:12.8px">
      <thead><tr><th>板块</th><th class="num">分值</th><th class="num">题量</th><th>作答</th></tr></thead>
      <tbody>${segRows}</tbody>
      <tfoot><tr><td>必做</td><td class="num">${p.mainTotal}</td><td class="num">${p.mainCount}</td><td></td></tr></tfoot>
      </table></div>
    </div>
    <div>
      <div style="font-size:12.2px;font-weight:700;color:var(--text-3);letter-spacing:.04em;margin-bottom:8px">能力与难度</div>
      ${CAT_ORDER.map((k) => distBar(CAT_NAME[k], p.cat[k] || 0, MAIN_TOTAL, ' 分')).join('')}
      <div style="height:10px"></div>
      ${DIFF_ORDER.map((k) => distBar(DIFF_NAME[k], p.diff[k] || 0, MAIN_TOTAL, ' 分', k === 'easy' ? 'ok' : k === 'hard' ? 'rose' : '')).join('')}
    </div>
  </div>
  <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:12.6px;color:var(--text-3);line-height:1.7">
    <b style="color:var(--text-2)">选做 ${p.bonusTotal} 分</b>（${bonus.length} 小题）：${esc(p.bonusLayout)}。
    ${p.note ? esc(p.note) + '。' : ''}
  </div>
</div>`;
  }).join('');

  const body = `
<section class="hero" style="padding-bottom:10px">
  <div class="hero-split wide">
    <div>
      <div class="hero-badge"><span class="dot-live"></span>${N_PAPERS} 套卷 · ${LEDGER.length} 题逐题台账</div>
      <h1 style="font-size:clamp(26px,3.2vw,36px)">逐年真题</h1>
      <p class="lede">
        ${N_PAPERS} 套西城期末卷（${YEARS.join(' / ')}）逐题拆解 <b>${LEDGER.length} 道</b>，
        按 <b>板块 → 能力 → 难度 → 考点</b> 四个维度统计。
        必做 ${MAIN_TOTAL} 分 / ${PAPER_STATS[0].mainCount} 小题，选做 ${BONUS_TOTAL} 分。
      </p>
    </div>
    <aside class="cockpit">
      <div class="cockpit-top"><span class="level-pill">卷面结构 · ${N_PAPERS} 套一致</span></div>
      ${SEG_ORDER.slice(0, 5).map((k) => `<div class="metric-row">
        <span class="mv accent">${fmt(SEG_SCORE[k].avg)}</span>
        <span class="ml"><b>${SEG_NAME[k]}</b>年均 ${PAPER_STATS[0].segN[k]} 小题</span>
      </div>`).join('')}
      <div class="metric-row" style="border-bottom:none">
        <span class="mv ok">${BONUS_TOTAL}</span>
        <span class="ml"><b>选做</b>计入总分，卷面封顶 ${MAIN_TOTAL}</span>
      </div>
    </aside>
  </div>
</section>

${section('① 板块', '各板块分值', `条长 = ${N_PAPERS} 年平均分值；${SEG_FIXED.length} 个板块的逐年分值完全一致`, segTable)}

${section('② 能力', '各能力分值', '四层能力，对应四种不同的补救动作', `
<div class="grid g2">
  <div class="card">${catBars}</div>
  <div class="card">
    <h3 style="margin-bottom:10px">四层能力与补救动作</h3>
    <ul class="clean">
    ${CAT_ORDER.map((k) => `<li><b>${CAT_NAME[k]}</b>：${esc(CAT_NOTE[k])}</li>`).join('')}
    </ul>
  </div>
</div>
`)}

${section('③ 难度', '难度三级分布', `按分值与题量两种口径统计`, `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">按分值（年均）</h3>
    ${diffBars}
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">按题量（年均）</h3>
    ${DIFF_ORDER.map((k) => distBar(DIFF_NAME[k], +(DIFF_SCORE[k].perN.reduce((a, b) => a + b, 0) / N_PAPERS).toFixed(1), PAPER_STATS[0].mainCount, ' 题', k === 'easy' ? 'ok' : k === 'hard' ? 'rose' : '')).join('')}
    <div class="note" style="margin-top:12px">
      较难档 ${fmt(HARD_AVG)} 分 / 年均 ${(DIFF_SCORE.hard.perN.reduce((a, b) => a + b, 0) / N_PAPERS).toFixed(1)} 题，
      集中在 <b>文段表达</b> 与 <b>阅读最后一道主旨/开放题</b>。
    </div>
  </div>
</div>
`)}

${section('④ 考点', '考点族与权重', `圆点字号 = ${SPAN_CN}年合计分值；颜色 = 命中次数（蓝 ${N_PAPERS}/${N_PAPERS} / 绿 ${FREQ_RULE.often}/${N_PAPERS} / 琥珀 更少）`, `
${famCloud}
<div class="note" style="margin-top:4px">
  按<b>板块</b>分组，组内按${SPAN_CN}年合计分值降序。共 ${FAM_RANKED.length} 个必做考点族${FAM_MAP.some((f) => f.onlyBonus) ? `，另有 ${FAM_MAP.filter((f) => f.onlyBonus).length} 个只在选做出现` : ''}。
</div>
`)}

${section('⑤ 逐年', '每套卷的明细', '同一批数据的逐年视图', paperCards)}
`;

  return page('papers.html', `逐年真题 · ${SITE.short}`, `${N_PAPERS} 套西城期末英语卷逐题拆解。`, body);
}

/* ============================ 趋势与考点 ============================ */
function buildTrend() {
  const structRows = STRUCTURE.map((s) => `<tr>
    <td><b>${esc(s.k)}</b></td>
    <td>${esc(s.v)}</td>
    <td><span class="tag ${s.same ? 'easy' : 'hard'}">${s.same ? `${SPAN_CN}年一致` : '有变化'}</span></td>
    <td style="color:var(--text-3);font-size:12.5px;white-space:normal">${s.note ? esc(s.note) : ''}</td>
  </tr>`).join('');

  // 作答方式：选择 vs 输出
  const modeCards = MODE_BREAKDOWN.map((b) => {
    const cls = b.mode === 'write' ? 'rose' : 'accent';
    return `<div class="card">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:12px">
        <span style="font-size:34px;font-weight:800;letter-spacing:-.035em;color:var(--${cls});font-variant-numeric:tabular-nums">${fmt(b.total)}</span>
        <span style="font-size:13px;color:var(--text-3)">分 · ${b.pct}%</span>
      </div>
      <h3 style="margin-bottom:10px">${esc(b.name)}</h3>
      ${b.segs.map((s) => `<div style="display:flex;justify-content:space-between;font-size:13.2px;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="color:var(--text-2)">${esc(s.name)}</span>
        <span style="font-weight:650;font-variant-numeric:tabular-nums">${fmt(s.score)}</span>
      </div>`).join('')}
    </div>`;
  }).join('');

  // 能力趋势
  const catTrend = CAT_ORDER.map((k) => {
    const c = CAT_SCORE[k];
    return `<tr>
      <td><b>${CAT_NAME[k]}</b></td>
      ${c.per.map((v) => `<td class="num">${fmt(v)}</td>`).join('')}
      <td class="num cell-hi">${fmt(c.avg)}</td>
      <td class="num">${c.range === 0 ? '0' : fmt(c.range)}</td>
      <td><span class="tag ${c.range === 0 ? 'easy' : c.range <= 3 ? 'mid' : 'hard'}">${c.range === 0 ? '不变' : c.range <= 3 ? '稳定' : '波动'}</span></td>
    </tr>`;
  }).join('');

  // 难度趋势
  const diffTrend = DIFF_ORDER.map((k) => {
    const d = DIFF_SCORE[k];
    return `<tr>
      <td><b>${DIFF_NAME[k]}</b></td>
      ${d.per.map((v) => `<td class="num">${fmt(v)}</td>`).join('')}
      <td class="num cell-hi">${fmt(d.avg)}</td>
      <td class="num">${fmt(d.range)}</td>
    </tr>`;
  }).join('');

  // 考点族完整表
  const famRows = FAM_RANKED.map((f) => {
    const isWrite = f.qs.length > 0 && f.qs.every((q) => q.mode === 'write');
    return `<tr>
      <td><b>${esc(f.name)}</b></td>
      <td style="color:var(--text-3);font-size:12.5px">${f.seg.map((s) => SEG_NAME[s]).join('、')}</td>
      <td class="num cell-hi">${fmt(f.avgPerYear)}</td>
      ${f.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
      <td><span class="yr ${f.hit === N_PAPERS ? 'hit' : ''}">${f.hit}/${N_PAPERS}</span></td>
      <td><span class="tag ${isWrite ? 'write' : 'select'}">${isWrite ? '输出' : '选择'}</span></td>
      <td class="wrap-cell" style="color:var(--text-3);font-size:12.4px">${esc(f.note)}</td>
    </tr>`;
  }).join('');

  // 选做
  const bonusRows = PAPER_STATS.map((p) => {
    const bonus = LEDGER.filter((q) => q.p === p.id && q.bonus);
    return `<tr>
      <td><b>${p.label}</b></td>
      <td class="num">${bonus.length}</td>
      <td class="num">${p.bonusTotal}</td>
      <td class="wrap-cell" style="font-size:12.6px;color:var(--text-3)">${esc(p.bonusLayout)}</td>
    </tr>`;
  }).join('');

  const body = `
<section class="hero" style="padding-bottom:10px">
  <div class="hero-split wide">
    <div>
      <div class="hero-badge"><span class="dot-live"></span>跨年对比 · ${N_PAPERS} 套样本</div>
      <h1 style="font-size:clamp(26px,3.2vw,36px)">趋势与考点</h1>
      <p class="lede">
        ${N_PAPERS} 套卷跨年对比：<b>什么没变</b>（结构、板块分值）、<b>什么在变</b>（能力与难度分布）、
        以及 <b>${FAM_RANKED.length} 个考点族</b>的分值权重与逐年命中。
      </p>
    </div>
    <aside class="cockpit">
      <div class="cockpit-top"><span class="level-pill">命题稳定性 · ${N_PAPERS} 套</span></div>
      <div class="metric-row"><span class="mv ok">${PROP_SUMMARY.stable.length}</span><span class="ml"><b>年年考</b>${N_PAPERS}/${N_PAPERS} 学年都出现</span></div>
      <div class="metric-row"><span class="mv accent">${PROP_SUMMARY.variable.length}</span><span class="ml"><b>多数年考</b>要会，但不押</span></div>
      <div class="metric-row" style="border-bottom:none"><span class="mv gold">${PROP_SUMMARY.sporadic.length}</span><span class="ml"><b>个别年考</b>认识即可</span></div>
    </aside>
  </div>
</section>

${section('① 结构', `${SPAN_CN}年没变的部分`, '这些是「按板块复习」能成立的全部依据', `
<div class="tbl-wrap">
<table>
<thead><tr><th>项目</th><th>值</th><th>跨年</th><th>备注</th></tr></thead>
<tbody>${structRows}</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>唯一会骗人的地方是题号。</b>${(() => {
    const big = PAPER_STATS.filter((p) => p.qTotal !== PAPER_STATS[0].qTotal);
    const small = PAPER_STATS.filter((p) => p.qTotal === PAPER_STATS[0].qTotal);
    const bigTxt = big.length
      ? `${big.map((p) => p.label).join('、')} 全卷 ${big.map((p) => p.qTotal).join('/')} 题、单选从第 1 题重新编号`
      : '各卷题号体系并不统一';
    const smallTxt = small.length
      ? `另 ${small.length} 套 ${small[0].qTotal} 题、连续编号`
      : '';
    return `${bigTxt}；${smallTxt}。`;
  })()}
  背「第几题考什么」会在换卷时失手，按板块识别才稳。
</div>
`, 'stability')}

${section('② 作答方式', '选择型与输出型', `同一份卷子，${SELECT_PCT}% 只涂卡，${WRITE_PCT}% 要写出来`, `
<div class="grid g2">${modeCards}</div>
<div class="note risk" style="margin-top:16px">
  <b>这是全站的核心切口。</b>输出型 ${fmt(WRITE_AVG)} 分里，${WRITE_SEG_LIST.map((s) => `${s.name} ${fmt(s.score)}`).join('、')}——
  每一项都有「会但写错」的空间：拼写、时态、人称、标点。<b>提分动作因此不是多刷题，是定向默写与句型改写。</b>
  <a href="special.html" style="color:var(--rose);font-weight:650">看专项怎么练 →</a>
</div>
`, 'mode')}

${section('③ 能力', '四层能力的跨年分布', `极差 ≤3 分视为稳定（满分 ${MAIN_TOTAL}）`, `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>能力</th>${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th class="num">年均</th><th class="num">极差</th><th>判定</th>
</tr></thead>
<tbody>${catTrend}</tbody>
</table>
</div>
`)}

${section('④ 难度', '难度三级的跨年分布', `难度指数${SPAN_CN}年几乎没有波动`, `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>难度</th>${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th class="num">年均</th><th class="num">极差</th>
</tr></thead>
<tbody>${diffTrend}</tbody>
</table>
</div>
<div class="note info" style="margin-top:14px">
  难度指数（1 = 全基础，3 = 全较难）逐年：
  ${PAPER_STATS.map((p) => `<b>${p.label} ${p.diffIndex}</b>`).join(' · ')}。
  ${SPAN_CN}年区间 ${DIFF_INDEX_MIN}–${DIFF_INDEX_MAX}，<b>说明难度是被稳定控制的</b>，不存在「某年突然变难」。
</div>
`)}

${section('⑤ 考点族', `全部 ${FAM_RANKED.length} 个必做考点族`, '按年均分值降序；「—」表示该年未考', `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>考点族</th><th>板块</th><th class="num">年均分</th>
  ${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th>命中</th><th>作答</th><th>说明</th>
</tr></thead>
<tbody>${famRows}</tbody>
</table>
</div>
<div class="note warn" style="margin-top:16px">
  <b>为什么主排序用分值而不是「必考」标签：</b>${N_PAPERS} 套样本下 ${FAM_N} 个族里有 ${ALWAYS_N} 个是 ${N_PAPERS}/${N_PAPERS} 命中，
  把它们全标成「必考」等于把 ${ALWAYS_N} 个族标成同一档，看不出先练哪个。
  但它们的年均分从 <b>${fmt(FAM_RANKED[0].avgPerYear)} 分到 ${fmt(FAM_RANKED[FAM_RANKED.length - 1].avgPerYear)} 分</b>，
  跨度 ${fmt(FAM_RANKED[0].avgPerYear - FAM_RANKED[FAM_RANKED.length - 1].avgPerYear)} 分——<b>这个差距才是排优先级的依据</b>。
  <br><br>
  频次仍有信息：${OFTEN_N} 个族是 ${FREQ_RULE.often}/${N_PAPERS}、${RARE_N} 个更少，这些「不是年年考」的族在表里已单独标出，
  可以据此判断哪些内容只需认识、不必死磕。
</div>
`, 'fam')}

${section('⑥ 阅读A篇', `A 篇${SPAN_CN}年换了不同考法`, '载体在变，考法也在变', `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th>载体</th><th>任务</th><th class="num">题量</th></tr></thead>
<tbody>
<tr><td><b>2021-22</b></td><td class="wrap-cell">三张动物海报（长颈鹿 / 豹 / 壁虎）</td><td class="wrap-cell">从表格里找事实：谁喜欢什么、哪种动物睡树上</td><td class="num">3</td></tr>
<tr><td><b>2024-25</b></td><td class="wrap-cell">四项学校活动介绍（文化 / 科学 / 音乐 / 运动）</td><td class="wrap-cell">按人物需求匹配活动，含 1 个多余选项</td><td class="num">3</td></tr>
<tr><td><b>2025-26</b></td><td class="wrap-cell">三个冬令营介绍（雪上运动 / 自然 / 雪艺术）</td><td class="wrap-cell">按人物需求匹配营地，A/B/C 三选一</td><td class="num">3</td></tr>
</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>这是本站最需要小心的一处归族。</b>2021-22 的 A 篇是「读表格找事实」（细节定位），
  2024-25 与 2025-26 才是「需求匹配」。我把前者的 3 题标为细节定位、后两套标为信息匹配，
  因此「阅读·信息匹配」显示 <b>2/${N_PAPERS}</b> 而不是 ${N_PAPERS}/${N_PAPERS}。
  <br><br>
  <b>但如果按「题位」归族（A 篇 = 匹配题），它就是 ${N_PAPERS}/${N_PAPERS}。</b>
  两种口径都说得通——我选了按「实际考法」，因为做题动作不同（找事实 vs 做匹配）。
  补入更多年份后若多数年份都是匹配题，这一族应改回 ${N_PAPERS}/${N_PAPERS} 口径。
</div>
`, 'readA')}

${section('⑦ 选做', `选做部分${SPAN_CN}年不一致`, '分值恒为 10 分，但题型与小题数在变', `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th class="num">小题数</th><th class="num">分值</th><th>构成</th></tr></thead>
<tbody>${bonusRows}</tbody>
</table>
</div>
<div class="note" style="margin-top:14px">
  <b>选做是缓冲垫，不是附加题。</b>计入总分但卷面封顶 ${MAIN_TOTAL} 分——
  必做丢 5 分，选做全对能补回；必做丢 15 分，选做全对也只能回到 ${MAIN_TOTAL}。
  所以<b>基础零失误优先于押选做</b>。
</div>
`, 'bonus')}
`;

  return page('trend.html', `趋势与考点 · ${SITE.short}`, `${N_PAPERS} 套卷跨年对比：结构、作答方式、能力、难度、考点族。`, body);
}


/* ============================ 输出 ============================ */

/* ============================ 专项复习（分层：总览 → 四部分 → 语法两子页） ============================ */
// 每个部分一个页面，语法下面再分「单选语法族 / 汉译英」两级。
// 数字仍全部从 stats.mjs 派生，不写常量。

const SPECIAL_CRUMB = (part, sub) => {
  const items = [{ href: 'special.html', label: '专项复习' }];
  if (part) items.push({ href: part.file, label: part.title });
  if (sub) items.push({ label: sub.label });
  return crumb(items);
};

const specialHead = (kicker, title, lede, aside) => `
<section class="hero" style="padding-bottom:8px">
  <div class="hero-split wide">
    <div>
      <div class="hero-badge"><span class="dot-live"></span>${kicker}</div>
      <h1 style="font-size:clamp(25px,3vw,34px)">${title}</h1>
      <p class="lede">${lede}</p>
    </div>
    ${aside ? `<aside class="cockpit">${aside}</aside>` : ''}
  </div>
</section>`;

// 右栏的紧凑指标：一个大数 + 若干构成行，不把 hero 撑成一屏
const segAside = (pill, bigN, bigLabel, rows, foot) => `
  <div class="cockpit-top"><span class="level-pill">${pill}</span></div>
  <div class="hero-metric"><span class="hm-n">${bigN}</span><span class="hm-l">${bigLabel}</span></div>
  <div class="seg-list">
    ${rows.map(([n, label, count]) => `<div class="seg-row">
      <span class="sr-n">${n}</span><span class="sr-l">${label}</span><span class="sr-c">${count}</span>
    </div>`).join('')}
  </div>
  ${foot ? `<div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--border);font-size:12.2px;color:var(--text-3);line-height:1.6">${foot}</div>` : ''}`;

/* ---------- 专项总览 ---------- */
function buildSpecial() {
  const partScore = {
    word: SEG_SCORE['音标填词'].avg + SEG_SCORE['听填'].avg,
    grammar: SEG_SCORE['单选'].avg,
    read: READ_STATS.totalScore,
    write: WRITE_STATS.score,
  };

  const body = `
${specialHead(
    `${N_PAPERS} 套真题 · 四部分逐题实证`,
    '专项复习',
    `单词、语法、阅读、写作——四部分的解题动作不一样，所以练法也不一样。
     这里不讲通用技巧，每一部分都给出<b>真题证据 → 解题方法 → 备考动作</b>。
     四部分各占一页，语法下面再分「单选语法族」和「汉译英」两页。`,
    `<div class="cockpit-top"><span class="level-pill">四部分分值</span></div>
      <div class="metric-row"><span class="mv accent">${fmt(partScore.word)}</span><span class="ml"><b>单词</b>音标 ${fmt(SEG_SCORE['音标填词'].avg)} + 听填 ${fmt(SEG_SCORE['听填'].avg)}</span></div>
      <div class="metric-row"><span class="mv" style="color:var(--purple)">${fmt(partScore.grammar)}</span><span class="ml"><b>语法</b>单选 ${GRAMMAR_FAMS.length} 族</span></div>
      <div class="metric-row"><span class="mv rose">${fmt(partScore.read)}</span><span class="ml"><b>阅读</b>选择 ${fmt(READ_STATS.selScore)} + 简答 ${fmt(READ_STATS.ansScore)}</span></div>
      <div class="metric-row" style="border-bottom:none"><span class="mv gold">${fmt(partScore.write)}</span><span class="ml"><b>写作</b>文段表达，≥${WRITE_STATS.wordMin} 词</span></div>`
  )}

<div class="note info" style="margin-top:6px">
  <b>这个顺序不是按分值排，是按「可练性」排。</b>单词最容易拿满（范围就是课本词表），
  阅读提分最慢（依赖词汇量）。所以从单词开始，把写作放最后——它是前三项能力的合成。
</div>

<section class="section" style="margin-top:30px">
  <div class="section-head"><div class="section-head-left">
    <span class="kicker">四个部分</span>
    <h2>每一部分一页，语法再分两级</h2>
    <span class="sub">每页都是同一套结构：真题证据 → 解题方法 → 备考动作</span>
  </div></div>

  <div class="part-grid">
    <div class="part-card">
      <div class="part-head"><span class="part-n">①</span><span class="part-title">单词</span><span class="part-score">${fmt(partScore.word)} 分</span></div>
      <p class="part-how"><b>先分清「会写」还是「认识」。</b>全卷 ${MAIN_TOTAL} 分里只有 ${fmt(SPELL_TOTAL)} 分要动笔，
        其余只需认得出。音标题 ${SPELL_STATS.total} 个词全是基础词，失分不是「不认识」是「拼不对」。</p>
      <div class="part-links">
        <a class="part-link" href="special-word.html">
          <span>音标 ${SPELL_STATS.total} 词 · ${SPELL_STATS.featureCount} 类拼写特征</span>
          <small>${fmt(SPELL_STATS.avgLen)} 字母均值</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>

    <div class="part-card p-grammar">
      <div class="part-head"><span class="part-n">②</span><span class="part-title">语法</span><span class="part-score">${fmt(partScore.grammar)} 分</span></div>
      <p class="part-how"><b>单选考「认」，汉译英考「写」。</b>${GRAMMAR_FAMS.length} 个语法族全部只出现在单选里，
        但其中 ${GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0).length} 族在汉译英里被二次考核——会选不等于会写。</p>
      <div class="part-links">
        <a class="part-link" href="special-grammar.html">
          <span>语法总览</span><small>${GRAMMAR_FAMS.length} 族 × 两次考核</small>
          <span class="pl-go">进入 →</span>
        </a>
        <a class="part-link" href="special-grammar-fam.html">
          <span>2·A 单选语法族</span><small>${GRAMMAR_FAMS.length} 族</small>
          <span class="pl-go">进入 →</span>
        </a>
        <a class="part-link" href="special-grammar-sent.html">
          <span>2·B 汉译英</span><small>${SENT_ITEMS.length} 句</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>

    <div class="part-card p-read">
      <div class="part-head"><span class="part-n">③</span><span class="part-title">阅读</span><span class="part-score">${fmt(partScore.read)} 分</span></div>
      <p class="part-how"><b>一半是细节题，先练「找」不练「猜」。</b>细节定位占选择题的 ${READ_STATS.selFams[0].pct}%，
        这类题不需要技巧，需要「回原文划证据句」这个动作。</p>
      <div class="part-links">
        <a class="part-link" href="special-read.html">
          <span>选择 ${fmt(READ_STATS.selScore)} + 简答 ${fmt(READ_STATS.ansScore)}</span>
          <small>${READ_STATS.selFams.length} 种题型</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>

    <div class="part-card p-write">
      <div class="part-head"><span class="part-n">④</span><span class="part-title">写作</span><span class="part-score">${fmt(partScore.write)} 分</span></div>
      <p class="part-how"><b>提示问题就是提纲。</b>${WRITE_STATS.total} 套题都给了 ${WRITE_Q_RANGE.min}–${WRITE_Q_RANGE.max} 个提示问题，
        照着题目结构写，${WRITE_STATS.wordMin} 词轻松够——不需要另想结构。</p>
      <div class="part-links">
        <a class="part-link" href="special-write.html">
          <span>${WRITE_STATS.total} 套真题 · ${WRITE_STATS.withEssay} 套有范文</span>
          <small>≥${WRITE_STATS.wordMin} 词</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>
  </div>
</section>

<div class="note risk">
  <b>写作排在最后，因为它是前三项的合成：</b>单词拼写（${fmt(SPELL_TOTAL)} 分那部分）、
  语法形式（${fmt(SEG_SCORE['单选'].avg)} 分那部分）、阅读积累的句式。前面三项稳了，写作的 ${fmt(WRITE_STATS.score)} 分才拿得住。
</div>
`;
  return page('special.html', `专项复习 · ${SITE.short}`,
    `单词、语法、阅读、写作四部分，每部分一页；语法再分单选语法族与汉译英两页。全部基于 ${N_PAPERS} 套真题。`, body);
}

/* ---------- ① 单词 ---------- */
function buildSpecialWord() {
  const part = SPECIAL_PARTS[0];
  const body = `
${SPECIAL_CRUMB(part)}
${specialTabs('word')}

${specialHead(
    '① 单词 · 音标与听填',
    '单词：先分清「会写」还是「认识」',
    `全卷 ${MAIN_TOTAL} 分里只有 <b>${fmt(SPELL_TOTAL)} 分要动笔</b>，其余 ${fmt(MAIN_TOTAL - SPELL_TOTAL)} 分只需认得出。
     而音标题考的 ${SPELL_STATS.total} 个词，全是课本里最基础的词。`,
    segAside(
      '要拼写的板块',
      fmt(SPELL_TOTAL),
      '分必须写出文字<br>其余 ' + fmt(MAIN_TOTAL - SPELL_TOTAL) + ' 分只需认得出',
      SPELL_SEGMENTS.map((s) => [fmt(s.score), esc(s.name), `${s.count} 题`]),
      '音标题 ' + SPELL_STATS.total + ' 词，全是基础词'
    )
  )}

<div class="note warn">
  <b>背单词背错方向，是把力气花在了不考的地方。</b>
  其余 ${fmt(MAIN_TOTAL - SPELL_TOTAL)} 分（阅读、单选、完形）只需认得出，不必会写。
</div>

${section('真题证据', `音标 ${SPELL_STATS.total} 个词：平均 ${SPELL_STATS.avgLen} 个字母`, `四年全部考词，最长 ${SPELL_STATS.maxLen} 个字母——不是难词`, `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th class="num">题号</th><th>音标</th><th>答案</th><th class="num">字母</th><th>句子原境</th><th>拼写特征</th></tr></thead>
<tbody>
${SPELL_ITEMS.map((it) => `<tr>
  <td class="num" style="color:var(--text-3)">${esc(PAPER_STATS.find((p) => p.id === it.p).label)}</td>
  <td class="num" style="color:var(--text-3)">${it.no}</td>
  <td><b style="font-family:var(--mono);font-size:13.4px">${esc(it.ipa)}</b></td>
  <td><b style="color:var(--accent)">${esc(it.word)}</b></td>
  <td class="num">${it.len}</td>
  <td class="wrap-cell" style="color:var(--text-3);font-size:12.6px">${esc(it.sent)}</td>
  <td style="white-space:normal">${it.feats.map((f) => `<span class="tag cat" style="margin-right:4px">${esc(f)}</span>`).join('')}</td>
</tr>`).join('')}
</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>这些不是难词，是最基础的词。</b>最短 ${SPELL_STATS.minLen} 个字母（cut / map / big）。
  所以音标题的失分<b>不是「不认识」，是「拼不对」</b>。
</div>
`, 'w-evidence')}

${section('解题与备考', `按易错点归成 ${SPELL_STATS.featureCount} 类`, '解题动作：看音标 → 定音节 → 拼字母 → 查形式', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">解题四步</h3>
    <ul class="clean">
      <li><b>看音标定元音。</b>先确定重读元音是哪个字母组合（${SPELL_FEATURES.slice(0, 3).map((f) => esc(f.name)).join(' / ')} 是最常见的三类）。</li>
      <li><b>数音节。</b>${SPELL_STATS.avgLen} 个字母平均 1–2 个音节，音节数对不上就是拼错了。</li>
      <li><b>查辅音丛。</b>spring 的 spr、driver 的 dr、smell 的 sm——漏一个字母就零分。</li>
      <li><b>查形式。</b>空前有 a / an 还是复数？句子的时态要不要加 -s / -ed？<b>这一步最容易丢分。</b></li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">备考三步</h3>
    <ul class="clean">
      <li><b>不背整本词表。</b>按上面 ${SPELL_STATS.featureCount} 类特征分批练，先练词数最多的三类。</li>
      <li><b>听写而不是默看。</b>看着单词背是「认读」，听写才是「拼写」——考的是后者。</li>
      <li><b>错词进本子，隔日回抽。</b>当天对的题不算掌握，隔一天还能写对才算。</li>
    </ul>
  </div>
</div>
<div class="grid g3" style="margin-top:14px">
${SPELL_FEATURES.slice(0, 6).map((f) => `<div class="card" style="padding:15px 17px">
  <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
    <b style="font-size:14px">${esc(f.name)}</b>
    <span style="font-size:12px;color:var(--text-3);margin-left:auto">${f.count} 词</span>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:5px">
    ${f.items.map((i) => `<span style="font-family:var(--mono);font-size:12.4px;background:var(--accent-soft);color:var(--accent);padding:2px 7px;border-radius:5px">${esc(i.word)}</span>`).join('')}
  </div>
</div>`).join('')}
</div>
`)}
`;
  return page('special.html', `单词专项 · ${SITE.short}`,
    `音标填词 ${SPELL_STATS.total} 词、听填 ${fmt(SEG_SCORE['听填'].avg)} 分：真题证据、解题四步与备考动作。`, body);
}

/* ---------- ② 语法总览 ---------- */
function buildSpecialGrammar() {
  const part = SPECIAL_PARTS[1];
  const doubleN = GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0).length;
  const body = `
${SPECIAL_CRUMB(part)}
${specialTabs('grammar')}
${grammarTabs('')}

${specialHead(
    '② 语法 · 两级入口',
    '语法：单选考「认」，汉译英考「写」',
    `同一批语法能力，在卷面上被考核两次：单选里选出来，汉译英里写出来。
     <b>${GRAMMAR_FAMS.length} 个语法族全部只出现在单项填空</b>，但 ${doubleN} 族在汉译英里被二次考核。`,
    segAside(
      '同一能力 · 两次考核',
      fmt(SEG_SCORE['单选'].avg + SEG_SCORE['汉译英'].avg),
      '分都落在语法能力上<br>一半靠选、一半靠写',
      [
        [fmt(SEG_SCORE['单选'].avg), '单选 · 只涂卡', `${GRAMMAR_FAMS.length} 族`],
        [fmt(SEG_SCORE['汉译英'].avg), '汉译英 · 要写出', `${SENT_ITEMS.length} 句`],
      ],
      `其中 <b style="color:var(--rose)">${doubleN}</b> 个族两处都考——既要会选又要会写`
    )
  )}

<div class="note risk">
  <b>${GRAMMAR_FAMS.length} 个语法族全部只出现在单项填空里，产出分为 0。</b>
  但这不等于语法只在单选考 ${fmt(SEG_SCORE['单选'].avg)} 分——它换了名字出现在汉译英和文段表达里。
  <b>会选不等于会写，这是两个动作。</b>
</div>

<section class="section" style="margin-top:30px">
  <div class="section-head"><div class="section-head-left">
    <span class="kicker">先看两张表</span>
    <h2>哪些族只考「认」，哪些要「写」</h2>
    <span class="sub">单选命中 ${N_PAPERS} 套全中的族，按年均分排序</span>
  </div></div>
  <div class="tbl-wrap">
  <table>
  <thead><tr>
    <th>语法族</th><th class="num">年均分</th>
    ${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
    <th>单选命中</th><th class="num">汉译英出现</th><th>判定</th>
  </tr></thead>
  <tbody>
  ${GRAMMAR_DOUBLE.map((g) => `<tr>
    <td><b>${esc(g.name)}</b></td>
    <td class="num cell-hi">${fmt(g.avgPerYear)}</td>
    ${g.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
    <td><span class="yr ${g.hit === N_PAPERS ? 'hit' : ''}">${g.hit}/${N_PAPERS}</span></td>
    <td class="num" style="font-weight:${g.writeHits ? 700 : 400};color:${g.writeHits ? 'var(--rose)' : 'var(--text-3)'}">${g.writeHits || '—'}</td>
    <td><span class="tag ${g.level === 'stable' ? 'easy' : g.level === 'variable' ? 'mid' : 'rare'}">${PROP_LEVEL_NAME[g.level]}</span></td>
  </tr>`).join('')}
  </tbody>
  </table>
  </div>
  <div class="note info" style="margin-top:14px">
    <b>${doubleN} 个族是「双重考核」</b>：${GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0).map((g) => `${esc(g.name)}（单选 ${g.hit}/${N_PAPERS} + 汉译英 ${g.writeHits} 句）`).join('、')}。
    这几族既要会选又要会写，<b>优先级高于只在单选出现的族</b>。
  </div>
</section>

<section class="section" style="margin-top:26px">
  <div class="section-head"><div class="section-head-left">
    <span class="kicker">往下分两级</span>
    <h2>两种练法，各一页</h2>
    <span class="sub">先练「写」的那一侧，因为它的证据更硬</span>
  </div></div>
  <div class="part-grid">
    <div class="part-card p-grammar">
      <div class="part-head"><span class="part-n">2·A</span><span class="part-title">单选语法族</span><span class="part-score">${fmt(SEG_SCORE['单选'].avg)} 分</span></div>
      <p class="part-how">${GRAMMAR_FAMS.length} 个族的逐族证据：每年考几题、考的是哪一句、${PROP_LEVEL_NAME.stable}的是哪 ${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length} 个。
        这一页回答「单选到底考什么」，以及每族该练哪个动作。</p>
      <div class="part-links">
        <a class="part-link" href="special-grammar-fam.html">
          <span>${GRAMMAR_FAMS.length} 族 · ${N_PAPERS} 套逐题</span>
          <small>${PROP_LEVEL_NAME.stable} ${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length} / 轮换 ${GRAMMAR_FAMS.filter((g) => g.level !== 'stable').length}</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>
    <div class="part-card p-grammar">
      <div class="part-head"><span class="part-n">2·B</span><span class="part-title">汉译英</span><span class="part-score">${fmt(SEG_SCORE['汉译英'].avg)} 分</span></div>
      <p class="part-how">${SENT_ITEMS.length} 句逐句拆解：提示词是什么、要求哪个语法动作、参考答案怎么写。
        这一页回答「语法被写出来时长什么样」，以及固定搭配为什么是主战场。</p>
      <div class="part-links">
        <a class="part-link" href="special-grammar-sent.html">
          <span>${SENT_ITEMS.length} 句 · ${SENT_GROUPS.length} 类动作</span>
          <small>固定搭配 ${SENT_GROUPS.find((g) => g.id === 'colloc')?.count || 0} 句最多</small>
          <span class="pl-go">进入 →</span>
        </a>
      </div>
    </div>
  </div>
</section>

${section('解题与备考', '两条总原则，两级页面各自展开', '先分清动作，再分页练', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">解题：先判断是「认」还是「写」</h3>
    <ul class="clean">
      <li><b>单选题问自己：能不能只靠排除？</b>能排除出来的，说明你「认」得，但未必「写」得出。</li>
      <li><b>汉译英题问自己：提示词给了什么骨架？</b>提示词是 <code style="font-family:var(--mono);font-size:12.4px">there be</code> 就不要换句型。</li>
      <li><b>两处都错的族才是真弱项。</b>单选对、汉译英错 = 会选不会写，这是${fmt(SEG_SCORE['汉译英'].avg)} 分丢分的主要形态。</li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">备考：两条腿一起走</h3>
    <ul class="clean">
      <li><b>单选侧按族刷。</b>先练${PROP_LEVEL_NAME.stable}的 ${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length} 族，它们 ${N_PAPERS} 套全中。</li>
      <li><b>写侧按句改。</b>拿一个基础句改成三单 / 过去 / 否定 / 疑问，一次覆盖四族。</li>
      <li><b>双重考核族优先。</b>${GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0).map((g) => esc(g.name)).join(' / ')} 两处都考，投入回报最高。</li>
    </ul>
  </div>
</div>
`)}
`;
  return page('special.html', `语法专项 · ${SITE.short}`,
    `语法分两级：单选 ${GRAMMAR_FAMS.length} 族与汉译英 ${SENT_ITEMS.length} 句，同一能力的两次考核。`, body);
}

/* ---------- 2·A 单选语法族 ---------- */
function buildSpecialGrammarFam() {
  const part = SPECIAL_PARTS[1];
  const sub = GRAMMAR_SUBS[0];
  const famNote = (id) => FAM_MAP.find((f) => f.id === id)?.note || '';
  const famTopics = (id) => FAM_MAP.find((f) => f.id === id)?.qs || [];

  const body = `
${SPECIAL_CRUMB(part, sub)}
${specialTabs('grammar')}
${grammarTabs('fam')}

${specialHead(
    '2·A 单选语法族',
    `${GRAMMAR_FAMS.length} 个族的逐族证据`,
    `单选 ${fmt(SEG_SCORE['单选'].avg)} 分、每年 ${PAPER_STATS[0].segN['单选'] || 10} 题。
     下面按「年均分 × 命中年数」排，每族给出考点原文，<b>不按语法书章节排</b>——按卷面实际考法排。`,
    segAside(
      '族的分档',
      `${GRAMMAR_FAMS.length}`,
      '个语法族<br>全部只出现在单选',
      [
        [`${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length}`, PROP_LEVEL_NAME.stable, `${N_PAPERS}/${N_PAPERS} 年`],
        [`${GRAMMAR_FAMS.filter((g) => g.level === 'variable').length}`, PROP_LEVEL_NAME.variable, '多数年'],
        [`${GRAMMAR_FAMS.filter((g) => g.level === 'sporadic').length}`, PROP_LEVEL_NAME.sporadic, '个别年'],
      ],
      '前两档要练到会用，第三档认识即可'
    )
  )}

<div class="note warn">
  <b>${PROP_LEVEL_NAME.stable}的 ${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length} 族是骨架，其余 ${GRAMMAR_FAMS.filter((g) => g.level !== 'stable').length} 族是轮换。</b>
  轮换项不要当必考背——${N_PAPERS} 套样本里它们最多出现 2 次。
</div>

${section('逐族证据', `${GRAMMAR_FAMS.length} 族 · 每年考几题`, '每张卡片的考点原文来自卷面，不是归纳', `
<div class="grid g2">
${GRAMMAR_FAMS.map((g) => {
  const qs = famTopics(g.id);
  return `<div class="fam">
  <div class="fam-head">
    <span class="fam-name">${esc(g.name)}</span>
    <span class="fam-score">年均 ${fmt(g.avgPerYear)} 分</span>
  </div>
  <div class="fam-meta">
    <span class="tag ${g.level === 'stable' ? 'easy' : g.level === 'variable' ? 'mid' : 'rare'}">${PROP_LEVEL_NAME[g.level]}</span>
    <span>${g.hit}/${N_PAPERS} 套命中</span>
  </div>
  <div class="fam-note">${esc(famNote(g.id))}</div>
  <div class="fam-years">
    ${g.per.map((v, i) => `<span class="yr ${v > 0 ? 'hit' : ''}" title="${YEARS[i]}">${YEARS[i].slice(2)} ${v > 0 ? v + ' 题' : '—'}</span>`).join('')}
  </div>
  <div style="margin-top:10px;padding-top:9px;border-top:1px solid var(--border);font-size:12.2px;color:var(--text-3);line-height:1.65">
    <b style="color:var(--text-2)">卷面考点：</b>${qs.map((q) => esc(q.topic)).join(' · ')}
  </div>
</div>`;
}).join('')}
</div>
`)}

${section('解题与备考', '先分「形式题」和「语境题」', '两种错的修法不一样', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">解题动作</h3>
    <ul class="clean">
      <li><b>先定考什么。</b>看选项差异：四个选项是同一个词的不同形式 → 考形式；是四个不同词 → 考语境。</li>
      <li><b>形式题查三处。</b>主语单复数、时间状语、空前助动词——这三处决定动词形式。</li>
      <li><b>语境题回句意。</b>把选项逐个代进句子读一遍，读不通的直接排除，不靠「感觉」。</li>
      <li><b>标出证据。</b>在题干上圈出决定答案的那个词（时间词 / 主语 / 提示词），圈不出来就是猜的。</li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">备考动作</h3>
    <ul class="clean">
      <li><b>按族练，不按题号练。</b>换卷时单选可能从第 1 题重新编号，背「第 13 题考代词」会失手。</li>
      <li><b>先练${PROP_LEVEL_NAME.stable}的 ${GRAMMAR_FAMS.filter((g) => g.level === 'stable').length} 族。</b>它们四年全中，年均分也最高。</li>
      <li><b>双重考核族优先。</b>${GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0).map((g) => esc(g.name)).join(' / ')} 在汉译英里还要写一遍。</li>
      <li><b>错题只记「错在哪一处」。</b>是形式选错还是语境读错——两类错的修法完全不同。</li>
    </ul>
  </div>
</div>
`)}
`;
  return page('special.html', `单选语法族 · ${SITE.short}`,
    `${GRAMMAR_FAMS.length} 个语法族的逐族真题证据：每年考几题、考点原文、解题与备考动作。`, body);
}

/* ---------- 2·B 汉译英 ---------- */
function buildSpecialGrammarSent() {
  const part = SPECIAL_PARTS[1];
  const sub = GRAMMAR_SUBS[1];
  const collocN = SENT_GROUPS.find((g) => g.id === 'colloc')?.count || 0;
  const maxGroup = Math.max(...SENT_GROUPS.map((g) => g.count));

  const body = `
${SPECIAL_CRUMB(part, sub)}
${specialTabs('grammar')}
${grammarTabs('sent')}

${specialHead(
    '2·B 汉译英',
    `${SENT_ITEMS.length} 句：语法真正被「写」出来的地方`,
    `汉译英 ${fmt(SEG_SCORE['汉译英'].avg)} 分、每年 ${PAPER_STATS[0].segN['汉译英'] || 3} 句。
     每句都标了提示词和实际要求的语法动作——<b>提示词就是骨架，不要自己换说法</b>。`,
    segAside(
      '动作分布',
      SENT_ITEMS.length,
      '句汉译英<br>每句 1–2 个语法动作',
      SENT_GROUPS.map((g) => [g.count, esc(g.label), `${g.count} 句`]),
      `固定搭配 ${collocN} 句最多——它最容易补`
    )
  )}

<div class="note warn">
  <b>固定搭配 ${collocN} 句，比任何单一语法规则都多。</b>
  汉译英的主战场不是「语法规则」，是<b>短语能不能直接写出来</b>。
</div>

${section('真题证据', `${SENT_ITEMS.length} 句逐句拆解`, '中文原句 / 提示词 / 语法动作 / 参考答案', `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th class="num">题号</th><th>中文原句</th><th>提示词</th><th>语法动作</th><th>参考答案</th></tr></thead>
<tbody>
${SENT_ITEMS.map((it) => `<tr>
  <td style="color:var(--text-3);font-size:12.4px">${esc(PAPER_STATS.find((p) => p.id === it.p).label)}</td>
  <td class="num" style="color:var(--text-3)">${it.no}</td>
  <td class="wrap-cell"><b>${esc(it.zh)}</b></td>
  <td class="wrap-cell" style="font-family:var(--mono);font-size:12.4px;color:var(--text-3)">${esc(it.hint)}</td>
  <td style="white-space:normal">${it.acts.map((a) => `<span class="tag write" style="margin-right:4px;margin-bottom:3px">${esc(a)}</span>`).join('')}</td>
  <td class="wrap-cell" style="font-size:12.6px;color:var(--ok)">${esc(it.ans)}</td>
</tr>`).join('')}
</tbody>
</table>
</div>
`, 'g-sent')}

${section('动作频次', `${SENT_GROUPS.length} 类动作，固定搭配最多`, '一句可能同时考两个动作，所以频次合计大于句数', `
<div class="card">
  ${SENT_GROUPS.map((g) => distBar(g.label, g.count, maxGroup, ' 句')).join('')}
</div>
<div class="note info" style="margin-top:14px">
  <b>按这个顺序练：</b>${SENT_GROUPS.map((g) => `${esc(g.label)}（${g.count}）`).join(' > ')}。
  固定搭配占比最高，也最容易补——它是「背了就会」的那一类。
</div>
`)}

${section('解题与备考', '解题动作：先定句型，再套词，最后查一致性', '不刷语法题册，只做「一句多改」', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">汉译英解题三步</h3>
    <ul class="clean">
      <li><b>看提示词定句型。</b>提示词就是骨架：给 <code style="font-family:var(--mono);font-size:12.4px">be good at</code> 就用 be good at，给 <code style="font-family:var(--mono);font-size:12.4px">there be</code> 就用 there be——不要自己换说法。</li>
      <li><b>套词后查主谓一致。</b>主语是单数还是复数？${GRAMMAR_DOUBLE.find((g) => g.id === 'f-agree')?.writeHits || 3} 句汉译英都在考这个。</li>
      <li><b>最后查时态与标点。</b>句末有没有句号？中文的「正在」= 现在进行时，别写成一般现在时。</li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">备考：一句多改</h3>
    <p style="font-size:13.2px;color:var(--text-2);line-height:1.75">
      拿一个基础句，改成四种形式——<b>三单 / 过去 / 否定 / 疑问</b>。<br><br>
      <code style="font-family:var(--mono);font-size:12.4px;background:var(--bg-3);padding:2px 6px;border-radius:4px">She is waiting for the bus.</code><br>
      → <code style="font-family:var(--mono);font-size:12.4px">He waits for the bus.</code>（三单）<br>
      → <code style="font-family:var(--mono);font-size:12.4px">She waited for the bus.</code>（过去）<br>
      → <code style="font-family:var(--mono);font-size:12.4px">She isn't waiting for the bus.</code>（否定）<br>
      → <code style="font-family:var(--mono);font-size:12.4px">Is she waiting for the bus?</code>（疑问）
    </p>
    <p style="font-size:12.8px;color:var(--text-3);margin-top:10px;line-height:1.7">
      <b>为什么有效：</b>一次操练覆盖时态、主谓一致、否定句、疑问句四族——
      正好是单选占比最高的四族，而且是在「写」的场景下练。
    </p>
  </div>
</div>
`)}
`;
  return page('special.html', `汉译英专项 · ${SITE.short}`,
    `${SENT_ITEMS.length} 句汉译英逐句拆解：提示词、语法动作、参考答案，以及固定搭配为何是主战场。`, body);
}

/* ---------- ③ 阅读 ---------- */
function buildSpecialRead() {
  const part = SPECIAL_PARTS[2];
  const selTotal = READ_STATS.selFams.reduce((a, f) => a + f.count, 0);
  const body = `
${SPECIAL_CRUMB(part)}
${specialTabs('read')}

${specialHead(
    '③ 阅读',
    '阅读：一半是细节题，先练「找」不练「猜」',
    `阅读 ${fmt(READ_STATS.totalScore)} 分 = 选择 ${fmt(READ_STATS.selScore)} + 简答 ${fmt(READ_STATS.ansScore)}。
     细节定位占选择题的 ${READ_STATS.selFams[0].pct}%——<b>这类题不需要技巧，需要「回原文划证据句」这个动作</b>。`,
    segAside(
      '阅读构成',
      fmt(READ_STATS.totalScore),
      '分阅读<br>选择 ' + fmt(READ_STATS.selScore) + ' + 简答 ' + fmt(READ_STATS.ansScore),
      [
        [fmt(READ_STATS.selScore), '选择 · 年均分', `${READ_STATS.selCount} 题/年`],
        [fmt(READ_STATS.ansScore), '简答 · 年均分', `${READ_STATS.ansCount} 题/年`],
      ],
      `${READ_STATS.selFams.length} 种题型，细节定位占 ${READ_STATS.selFams[0].pct}%`
    )
  )}

${section('题型分布', `阅读选择 ${selTotal} 题怎么分`, '四年合计，按题量排', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:12px">阅读选择题型分布（四年 ${selTotal} 题）</h3>
    ${READ_STATS.selFams.map((f) => distBar(f.name, f.count, READ_STATS.selFams[0].count, ' 题')).join('')}
  </div>
  <div class="card">
    <h3 style="margin-bottom:12px">阅读简答：${READ_STATS.ansCount} 题 ${fmt(READ_STATS.ansScore)} 分</h3>
    <div style="font-size:13.4px;color:var(--text-2);line-height:1.9">
      <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
        <span><b>前三题：检索</b>（问什么答什么）</span><span style="font-weight:700;color:var(--accent)">${READ_ANS_TYPES.retrievePerPaper} 题 / ${fmt(READ_ANS_TYPES.retrieveScore)} 分</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span><b>末题：概括或开放</b>（全文/看法）</span><span style="font-weight:700;color:var(--rose)">${READ_ANS_TYPES.openPerPaper} 题 / ${fmt(READ_ANS_TYPES.openScore)} 分</span>
      </div>
    </div>
    <div class="note" style="margin-top:14px;font-size:12.8px">
      <b>末题四年分别是</b>：蚂蚁教我们什么 / 末段作者想说什么 / 全文主要讲什么 / 是否想尝试观鸟及理由。
      <b>永远考「概括」，不考「找」。</b>
    </div>
  </div>
</div>
<div class="note info" style="margin-top:16px">
  <b>细节题占 ${READ_STATS.selFams[0].pct}%，是阅读选择的一半。</b>
  这类题不需要技巧，需要「回原文找」这个动作——<b>每道题划出证据句</b>，划不出来就是靠猜。
</div>
`, 'r-evidence')}

${section('解题与备考', '按题型给动作，不背「阅读技巧」', '五种题型，五种动作', `
<div class="tbl-wrap">
<table>
<thead><tr><th>题型</th><th class="num">占比</th><th>解题动作</th><th>常见错因</th></tr></thead>
<tbody>
${READ_STATS.selFams.map((f) => {
  const act = {
    'f-read-detail': ['回原文划出对应句，在题号旁标段落号', '凭印象选；同义替换没认出来'],
    'f-read-main': ['看首段末句 + 各段首句 + 末段；先用排除法去掉「太窄」和「太宽」', '选了只讲某一段的选项'],
    'f-read-infer': ['推断的答案一定能在原文找到支撑，找不到支撑的选项直接排除', '选了「看似合理但文中没说」的'],
    'f-read-match': ['先看题干里的关键词，再回各段找同义改写；匹配题不要逐句读', '把「相关」当成「匹配」'],
    'f-read-word': ['看划线词前后一句：同义复现 / 反义对比 / 举例说明', '凭「背过的意思」直选，不看上下文'],
  }[f.id] || ['回原文定位', '凭感觉选'];
  return `<tr>
  <td><b>${esc(f.name.replace('阅读·', ''))}</b></td><td class="num">${f.pct}%</td>
  <td class="wrap-cell">${act[0]}</td>
  <td class="wrap-cell">${act[1]}</td>
</tr>`;
}).join('')}
</tbody>
</table>
</div>
<div class="grid g2" style="margin-top:16px">
  <div class="card">
    <h3 style="margin-bottom:10px">简答三查</h3>
    <ul class="clean">
      <li><b>查问什么。</b>问 Why 不要答 What，问 When 不要答 Where。</li>
      <li><b>查人称时态。</b>问句是 he，答案不能照抄原文的 I；问句过去时，答案跟着过去时。</li>
      <li><b>查是否抄多了。</b>原文一整句里只要那个短语，就只写那个短语。</li>
    </ul>
    <div class="note" style="margin-top:12px;font-size:12.6px">
      <b>参考答案自己也不统一：</b>2022-23 第 44 题给的是 <code style="font-family:var(--mono)">Tiger sharks.</code>（短语），
      2023-24 给的是完整句。所以<b>别硬凑完整句</b>——宁可短而准，不要长而错。
    </div>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">末题两句话模板</h3>
    <p style="font-size:13.2px;color:var(--text-2);line-height:1.75">
      <b>概括型</b>（全文讲什么）：<br>
      <code style="font-family:var(--mono);font-size:12.4px">The passage is about ______.</code><br><br>
      <b>开放型</b>（你想不想试）：<br>
      <code style="font-family:var(--mono);font-size:12.4px">Yes. Because ______.</code><br><br>
      <b>关键：</b>表态明确 + 理由具体。参考答案给的就是 <code style="font-family:var(--mono);font-size:12.4px">Yes. Because it is interesting.</code>——两句就是满分。
    </p>
  </div>
</div>
`, 'r-how')}
`;
  return page('special.html', `阅读专项 · ${SITE.short}`,
    `阅读 ${fmt(READ_STATS.totalScore)} 分：${READ_STATS.selFams.length} 种题型占比、简答检索与概括，以及每种题的解题动作。`, body);
}

/* ---------- ④ 写作 ---------- */
function buildSpecialWrite() {
  const part = SPECIAL_PARTS[3];
  const withEssay = WRITE_ITEMS.filter((w) => w.essay);
  const body = `
${SPECIAL_CRUMB(part)}
${specialTabs('write')}

${specialHead(
    '④ 写作',
    '写作：提示问题就是提纲，照抄题目结构',
    `文段表达 ${fmt(WRITE_STATS.score)} 分、≥${WRITE_STATS.wordMin} 词。
     ${WRITE_STATS.total} 套题都给了 ${WRITE_Q_RANGE.min}–${WRITE_Q_RANGE.max} 个提示问题——<b>每个问题写 1–2 句，${WRITE_STATS.wordMin} 词轻松够</b>。`,
    segAside(
      '文段表达',
      fmt(WRITE_STATS.score),
      '分<br>必做最后一题',
      [
        [WRITE_STATS.wordMin, '词数下限', '四套一致'],
        [`${WRITE_STATS.withEssay}/${WRITE_STATS.total}`, '有范文', '其余原卷未给'],
      ],
      '提示问题就是提纲，不需要另想结构'
    )
  )}

${section('真题证据', `${WRITE_STATS.total} 套的话题与提纲`, '提示问题 = 现成提纲', `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th>话题</th><th>提示问题（= 提纲）</th><th>提示词</th><th>范文</th></tr></thead>
<tbody>
${WRITE_ITEMS.map((w) => `<tr>
  <td style="color:var(--text-3);font-size:12.4px">${esc(PAPER_STATS.find((p) => p.id === w.p).label)}</td>
  <td class="wrap-cell"><b>${esc(w.scene)}</b></td>
  <td class="wrap-cell" style="font-size:12.6px;color:var(--text-2)">${esc(w.questions)}</td>
  <td class="wrap-cell" style="font-family:var(--mono);font-size:12.2px;color:var(--text-3)">${esc(w.promptWords)}</td>
  <td>${w.essay ? '<span class="tag easy">有</span>' : '<span class="tag rare">原卷未给</span>'}</td>
</tr>`).join('')}
</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>${N_PAPERS} 套题都给了 ${WRITE_Q_RANGE.min}–${WRITE_Q_RANGE.max} 个提示问题，这就是现成的提纲。</b>
  每个问题写 1–2 句，${WRITE_STATS.wordMin} 词轻松够——不需要另想结构。
</div>
`, 'w-prompt')}

${section('范文拆解', '范文不长，但每句都在回应题目', `${withEssay.length} 套卷给了范文，逐句看它怎么答`, `
${withEssay.map((w) => `
<div class="card" style="margin-bottom:14px">
  <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:10px;flex-wrap:wrap">
    <h3 style="margin:0">${esc(w.scene)}</h3>
    <span class="tag ch">${esc(PAPER_STATS.find((p) => p.id === w.p).label)}</span>
    <span style="font-size:12.3px;color:var(--text-3)">${w.essay.split(/\s+/).length} 词</span>
  </div>
  <p style="font-size:13.4px;color:var(--text-2);line-height:1.85;background:var(--surface-2);padding:14px 16px;border-radius:10px;border-left:3px solid var(--ok)">
    ${esc(w.essay)}
  </p>
  <div style="margin-top:10px;font-size:12.6px;color:var(--text-3);line-height:1.7">
    <b>结构拆解：</b>${esc(w.questions)}
  </div>
</div>`).join('')}
<div class="note" style="margin-top:6px">
  <b>两套卷原卷未给范文</b>（${WRITE_ITEMS.filter((w) => !w.essay).map((w) => esc(PAPER_STATS.find((p) => p.id === w.p).label)).join('、')}），
  所以只能分析题目结构，不能分析范文。这一条不补。
</div>
`, 'w-essay')}

${section('解题与备考', '四步写完，最后一步决定分数', '内容分靠提纲，语言分靠检查', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">解题四步</h3>
    <ul class="clean">
      <li><b>读提示问题，抄成提纲。</b>${WRITE_STATS.total} 套题都有 ${WRITE_Q_RANGE.min}–${WRITE_Q_RANGE.max} 个提示问题，一个问题是正文一段。</li>
      <li><b>每段写 1–2 句。</b>第一句回应问题，第二句给细节（原因/例子/感受）。</li>
      <li><b>套提示词。</b>题目给的提示词是「可以用的词」，不是必须全用——挑 2–3 个用得顺的。</li>
      <li><b>检查三件事。</b>动词形式（三单/过去）、名词单复数、句末标点。<b>这一步最容易丢分。</b></li>
    </ul>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">备考三步</h3>
    <ul class="clean">
      <li><b>不背范文，背「结构」。</b>范文的话题每年换，但「问题→回答」的结构不变。</li>
      <li><b>限时 10 分钟写 ${WRITE_STATS.wordMin} 词。</b>写作在卷面最后，时间通常被前面挤掉——必须练到 10 分钟内完成。</li>
      <li><b>写完必自查。</b>按上面「检查三件事」逐条过，养成习惯后每次能捡回 1–2 分。</li>
    </ul>
  </div>
</div>
<div class="note risk" style="margin-top:16px">
  <b>写作是前三项的合成：</b>单词拼写（${fmt(SPELL_TOTAL)} 分那部分）、语法形式（${fmt(SEG_SCORE['单选'].avg)} 分那部分）、
  阅读积累的句式。所以它排在最后——前面三项稳了，写作的 ${fmt(WRITE_STATS.score)} 分才拿得住。
</div>
`)}
`;
  return page('special.html', `写作专项 · ${SITE.short}`,
    `文段表达 ${fmt(WRITE_STATS.score)} 分：${WRITE_STATS.total} 套真题的提纲与范文拆解，以及四步写法与自查清单。`, body);
}

const pages = {
  'index.html': buildHome(),
  'papers.html': buildPapers(),
  'trend.html': buildTrend(),
  'special.html': buildSpecial(),
  'special-word.html': buildSpecialWord(),
  'special-grammar.html': buildSpecialGrammar(),
  'special-grammar-fam.html': buildSpecialGrammarFam(),
  'special-grammar-sent.html': buildSpecialGrammarSent(),
  'special-read.html': buildSpecialRead(),
  'special-write.html': buildSpecialWrite(),
};

for (const [name, html] of Object.entries(pages)) {
  writeFileSync(name, html, 'utf8');
  console.log(`  ${name}  ${(html.length / 1024).toFixed(1)} KB`);
}
console.log(`\n✓ 生成 ${Object.keys(pages).length} 页`);
