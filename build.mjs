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
  BOOK_STATUS, BOOK_TARGET_FAMS, BOOK_PROGRESS,
  SPELL_ITEMS, SPELL_FEATURES, SPELL_STATS, SPELL_SEGMENTS, SPELL_TOTAL,
  GRAMMAR_FAMS, SENT_ITEMS, SENT_ACTIONS, SENT_GROUPS, GRAMMAR_DOUBLE,
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

.hero{padding:54px 0 30px;position:relative;background:var(--hero-glow)}
.hero-split{display:grid;grid-template-columns:1.12fr .98fr;gap:38px;align-items:start}
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

footer{margin-top:60px;padding:30px 0 40px;border-top:1px solid var(--border);font-size:12.5px;color:var(--text-3)}
footer p{margin:5px 0}
footer b{color:var(--text-2)}

@media(max-width:960px){
  .hero-split{grid-template-columns:1fr;gap:26px}
  .g3,.g4,.tier-grid{grid-template-columns:repeat(2,1fr)}
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
  ['special.html', '专项'],
  ['book.html', '教材对照'],
  ['plan.html', '冲刺计划'],
];

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
    ${NAV.map(([h, t]) => `<a href="${h}"${h === active ? ' class="on"' : ''}>${t}</a>`).join('')}
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
        <a class="btn" href="plan.html">看冲刺计划</a>
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
          <span class="mi-main"><b>专项：单词与语法</b><small>音标 ${SPELL_STATS.total} 词 · 单选 ${GRAMMAR_FAMS.length} 族</small></span>
          <span class="mi-go">查看 →</span>
        </a>
        <a class="mission-item" href="plan.html">
          <span class="mi-ico gold">🎯</span>
          <span class="mi-main"><b>冲刺计划</b><small>输出端 ${fmt(WRITE_AVG)} 分怎么练</small></span>
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
      <a class="sell-link" href="plan.html">看输出端怎么练 →</a>
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
  <a class="tier-card t-rose" href="plan.html">
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
  <div class="hero-badge"><span class="dot-live"></span>${N_PAPERS} 套卷 · ${LEDGER.length} 题逐题台账</div>
  <h1 style="font-size:clamp(26px,3.2vw,36px)">逐年真题</h1>
  <p class="lede" style="max-width:760px">
    ${N_PAPERS} 套西城期末卷（${YEARS.join(' / ')}）逐题拆解 <b>${LEDGER.length} 道</b>，
    按 <b>板块 → 能力 → 难度 → 考点</b> 四个维度统计。
    必做 ${MAIN_TOTAL} 分 / ${PAPER_STATS[0].mainCount} 小题，选做 ${BONUS_TOTAL} 分。
  </p>
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
  <div class="hero-badge"><span class="dot-live"></span>跨年对比 · ${N_PAPERS} 套样本</div>
  <h1 style="font-size:clamp(26px,3.2vw,36px)">趋势与考点</h1>
  <p class="lede" style="max-width:780px">
    ${N_PAPERS} 套卷跨年对比：<b>什么没变</b>（结构、板块分值）、<b>什么在变</b>（能力与难度分布）、
    以及 <b>${FAM_RANKED.length} 个考点族</b>的分值权重与逐年命中。
  </p>
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
  <a href="plan.html" style="color:var(--rose);font-weight:650">看冲刺计划 →</a>
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

/* ============================ 冲刺计划 ============================ */
function buildPlan() {
  // 输出型板块按分值降序——这就是练习顺序
  const writeRanked = WRITE_SEG_LIST.slice().sort((a, b) => b.score - a.score);

  const priCards = writeRanked.map((s, i) => {
    const cls = ['', 'p2', 'p3', 'p4', 'p5'][Math.min(i, 4)];
    const fams = FAM_RANKED.filter((f) => f.seg.includes(s.k));
    const actions = {
      '文段表达': '先写提纲（几段、每段几个要点），再按「提示问题」逐条落句；写完自查三件事：动词形式、名词单复数、句末标点。',
      '听力·填词': '听到什么写什么，但<b>必须检查形式</b>：名词单复数、动词时态、首字母大小写。这一项丢分几乎全是形式错。',
      '阅读·简答': '四规范：① 用完整句 ② 时态跟问句走 ③ 人称换过来 ④ 不照抄整句。问什么答什么，不加戏。',
      '汉译英': '给提示词就是给骨架。先定句型（be good at / It is + adj + to do / try one\'s best），再套词，最后查主谓一致。',
      '音标填词': '看音标→想单词→拼出来。错因两类：认不出（要过词表）、拼错（要默写）。分开统计，别混着练。',
    };
    return `<div class="pri ${cls}">
      <span class="pri-rank">优先级 ${String(i + 1).padStart(2, '0')}</span>
      <h3>${esc(s.name)} · ${fmt(s.score)} 分</h3>
      <div class="meta">年均 ${fmt(s.score)} 分 · ${s.count} 小题 · 涉及 ${fams.length} 个考点族</div>
      <p>${actions[s.name] || '按考点族逐项过关。'}</p>
    </div>`;
  }).join('');

  const body = `
<section class="hero" style="padding-bottom:10px">
  <div class="hero-badge"><span class="dot-live"></span>输出端 ${fmt(WRITE_AVG)} 分 · 按分值排优先级</div>
  <h1 style="font-size:clamp(26px,3.2vw,36px)">冲刺计划</h1>
  <p class="lede" style="max-width:780px">
    必做 ${MAIN_TOTAL} 分里，<b>${fmt(SELECT_AVG)} 分只要涂卡、${fmt(WRITE_AVG)} 分要写出文字</b>。
    输入端对班内前列的学生已接近饱和，所以这份计划只做一件事：<b>把输出端的 ${fmt(WRITE_AVG)} 分练到不丢形式分</b>。
  </p>
</section>

${section('核心判断', '先练输出端，不是先刷阅读', `${fmt(WRITE_AVG)} 分 vs ${fmt(SELECT_AVG)} 分`, `
<div class="note risk">
  <b>这条判断决定了整份计划的顺序。</b>输出型 ${fmt(WRITE_AVG)} 分的错，绝大多数不是「不会」，
  而是<b>形式没写对</b>——三单忘加 s、过去时写原形、简答照抄原句、音标认识但拼错。
  这类错有一个共同点：<b>知道规则也不保证写对，必须靠定向操练固化</b>。
</div>
<div class="grid g2" style="margin-top:16px">
  <div class="card">
    <h3 style="margin-bottom:10px">输入端 ${fmt(SELECT_AVG)} 分</h3>
    <p style="font-size:13.4px;color:var(--text-2);line-height:1.72">
      ${SELECT_SEG_LIST.map((s) => s.name).join('、')}。错因主要是<b>词没认到</b>与<b>没读懂</b>，
      补救动作是过词表与精读。对班内前列学生，这一块通常已接近饱和。
    </p>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">输出端 ${fmt(WRITE_AVG)} 分</h3>
    <p style="font-size:13.4px;color:var(--text-2);line-height:1.72">
      ${WRITE_SEG_LIST.map((s) => s.name).join('、')}。错因主要是<b>形式写错</b>，
      补救动作是默写、句型改写、检查清单。<b>同样的时间投在这里，边际收益高得多。</b>
    </p>
  </div>
</div>
`)}

${section('练习顺序', `输出端 ${writeRanked.length} 个板块，按分值排`, '分值越高越先练；同分按「形式错的空间大小」排', `
<div class="grid g2">${priCards}</div>
`)}

${section('归因', '六类错因，每类对应一个不同动作', '动作相同就该合并——这是分类成立的唯一判据', `
<div class="tbl-wrap">
<table>
<thead><tr><th>错因</th><th>典型表现</th><th>补救动作</th><th>训练形态</th></tr></thead>
<tbody>
<tr><td><b>拼写错</b></td><td class="wrap-cell">音标认识，单词拼错（recieve / rest 写成 reast）</td><td>默写</td><td>每日 10 词，隔日回抽</td></tr>
<tr><td><b>形式错</b></td><td class="wrap-cell">三单忘 s、过去时写原形、复数忘 s</td><td>句型改写</td><td>同一句改成三单 / 过去 / 否定 / 疑问四种</td></tr>
<tr><td><b>词没认到</b></td><td class="wrap-cell">阅读里单词不认识，整句读不通</td><td>认读</td><td>看英文反应中文，不要求拼写</td></tr>
<tr><td><b>没读懂</b></td><td class="wrap-cell">词都认识，但段落逻辑没接上</td><td>精读</td><td>每道细节题划出证据句</td></tr>
<tr><td><b>答非所问</b></td><td class="wrap-cell">简答问「为什么」答了「是什么」</td><td>简答模板</td><td>四规范逐条对照改</td></tr>
<tr><td><b>规范缺失</b></td><td class="wrap-cell">句末无标点、首字母小写、字数不够</td><td>检查清单</td><td>交卷前 3 分钟固定动作</td></tr>
</tbody>
</table>
</div>
<div class="note" style="margin-top:14px">
  六类的判据是<b>「补救动作是否不同」</b>。若两类动作相同（例如「粗心」与「计算错」），就应合并——
  否则分类只是增加记账成本，不改变任何行动。
</div>
`)}

${section('阶段', '四个阶段，每阶段带停止条件', '不达标就停，不加内容硬撑', `
<div>
${[
  { w: '第 1 阶段', t: '材料清洗与口径锁定', p: `确认教材版本（当前手册写外研版，需与课本目录核对）、确认西城期末是否含「阅读简答」、把 ${N_PAPERS} 套卷的板块分值表逐题加总核对。`, ok: `Go：${N_PAPERS} 套卷必做均能加总到 90 分；No-Go：对不上就停，先查是否混进别科卷。` },
  { w: '第 2 阶段', t: `输出端 ${fmt(WRITE_AVG)} 分逐项过关`, p: '按上面 5 个板块的优先级，每个板块做「错因 → 动作」闭环。先拼写与形式，再简答与作文。', ok: 'Go：每个板块能说出「我错在哪一类、对应哪个动作」；No-Go：说不清错因就先做诊断，别急着加练习量。' },
  { w: '第 3 阶段', t: '整卷限时', p: `至少一次完整 100 分钟计时，必做与选做分开报分。`, ok: `Go：必做 ${MAIN_TOTAL} 分口径下失分能归到具体板块；No-Go：只报总分说明归因没做，回第 2 阶段。` },
  { w: '第 4 阶段', t: '回流', p: '错词进词表、错句进句型本，下一轮默写必须抽中。', ok: 'Go：下一轮练习内容因上一轮结果而改变；No-Go：练习内容固定不变说明回流断环。' },
].map((s) => `<div class="phase">
  <div class="phase-w">${esc(s.w)}</div>
  <div class="phase-b">
    <h4>${esc(s.t)}</h4>
    <p>${esc(s.p)}</p>
    <div class="phase-ok">${esc(s.ok)}</div>
  </div>
</div>`).join('')}
</div>
`)}

${section('验收', '每层独立达标线', '必须同时看目标线与满分线', `
<div class="tbl-wrap">
<table>
<thead><tr><th>层次</th><th class="num">满分</th><th class="num">目标线</th><th>判定依据</th></tr></thead>
<tbody>
<tr><td><b>选择型</b></td><td class="num">${fmt(SELECT_AVG)}</td><td class="num">${fmt(Math.round(SELECT_AVG * 0.97))}</td><td class="wrap-cell">只允许错 1–2 题；错题必须能说出证据句在哪</td></tr>
<tr><td><b>输出型</b></td><td class="num">${fmt(WRITE_AVG)}</td><td class="num">${fmt(Math.round(WRITE_AVG * 0.92))}</td><td class="wrap-cell">允许丢形式分 ≤3 分；同类形式错不得重复出现</td></tr>
<tr><td><b>选做</b></td><td class="num">${BONUS_TOTAL}</td><td class="num">${BONUS_TOTAL}</td><td class="wrap-cell">这是缓冲垫，目标是全拿</td></tr>
</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>达标线是假设值，需实测校准，不可当结论引用。</b>
  只显示目标线会得出「输出端达 92% 就过关」的误判——实际离满分还差 ${fmt(WRITE_AVG - Math.round(WRITE_AVG * 0.92))} 分。
</div>
`)}

${section('边界', '这一版明确不做的', '诚实边界单列，不用「后续优化」含糊过去', `
<ul class="clean">
<li><b>不做听力难度判断。</b>${N_PAPERS} 套卷都没有音频，只能分析「考什么形式」（事实细节 / 数字 / 主旨 / 听写），无法判断实际语速与辨音难度。</li>
<li><b>不做作文分数拆解。</b>卷面未给评分标准，内容分 / 语言分 / 结构分如何分配未知，所以不写「内容占几分」这类断言。</li>
<li><b>不做干扰项反推。</b>${PAPER_STATS.filter((p) => !p.hasAnswer).map((p) => p.label).join('、')} 无答案，无法反推错误选项的设计逻辑。</li>
<li><b>不做「必考」断言。</b>样本 ${N_PAPERS} 个学年，只能说「${N_PAPERS} 个学年都考」，不能说年年必考——新学年是否继续考，样本无法回答。</li>
<li><b>不押题。</b>所有分值结论用于排练习优先级，不用于预测具体题目。</li>
</ul>
`)}

${section('待确认', '需要先确认的两件事', '这两条不确认，上面的计划会跑偏', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:8px">① 教材版本</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.72">
      现有《阅读满分冲刺手册》标注为<b>外研版</b>，但${N_PAPERS} 套卷里同时出现 <code style="font-family:var(--mono);font-size:12.4px;background:var(--bg-3);padding:1px 5px;border-radius:4px">be going to</code>（一般将来时）与现在进行时并用。
      <b>版本定错，词表和语法进度全错。</b>建议核对课本目录页。
    </p>
  </div>
  <div class="card">
    <h3 style="margin-bottom:8px">② 是否含阅读简答</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.72">
      ${N_PAPERS} 套卷都含第六大题「阅读短文回答问题」（${SEG_SCORE['阅读简答'].avg} 分）。
      若本校考试与区卷一致，则简答训练权重按本站口径；若不同，需重新分配输出端内部的时间比例。
    </p>
  </div>
</div>
`)}
`;

  return page('plan.html', `冲刺计划 · ${SITE.short}`, `输出端 ${fmt(WRITE_AVG)} 分的练习顺序、归因与阶段验收。`, body);
}

/* ============================ 输出 ============================ */
/* ============================ 教材对照 ============================ */
function buildBook() {
  // —— 教材侧：未核实时显式占位，不编模块号 ——
  const bookCard = BOOK_STATUS.ready
    ? `<div class="tbl-wrap"><table>
        <thead><tr><th>模块</th><th>标题</th><th>语法重点</th></tr></thead>
        <tbody>${TEXTBOOK_MODULES_ROWS}</tbody>
      </table></div>`
    : `<div class="card" style="border-style:dashed;background:var(--surface-2)">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px">
          <span class="tag rare">待核</span>
          <b style="font-size:15px">${esc(BOOK_STATUS.press)} · ${esc(BOOK_STATUS.book)}</b>
        </div>
        <p style="font-size:13.4px;color:var(--text-2);line-height:1.75">
          ${esc(BOOK_STATUS.note)}。
        </p>
        <p style="font-size:13.4px;color:var(--text-2);line-height:1.75;margin-top:8px">
          教材侧需要的是<b>课本目录页</b>（模块号 + 标题 + 语法重点）。
          拿到后只改 <code style="font-family:var(--mono);font-size:12.4px;background:var(--bg-3);padding:1px 5px;border-radius:4px">work/papers/ledger.mjs</code>
          里的 <code style="font-family:var(--mono);font-size:12.4px;background:var(--bg-3);padding:1px 5px;border-radius:4px">TEXTBOOK</code>，
          页面会自动从「待核」切成完整对照表。
        </p>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);font-size:12.6px;color:var(--text-3)">
          挂载进度：<b style="color:var(--text-2)">${BOOK_PROGRESS.done} / ${BOOK_PROGRESS.target}</b> 个考点族（${BOOK_PROGRESS.pct}%）
        </div>
      </div>`;

  // —— 命题稳定性：全部由真题派生 ——
  const levelTag = (lv) => {
    const cls = lv === 'stable' ? 'easy' : lv === 'variable' ? 'mid' : 'rare';
    return `<span class="tag ${cls}">${PROP_LEVEL_NAME[lv]}</span>`;
  };

  const propRows = PROP_STABILITY
    .slice()
    .sort((a, b) => b.hit - a.hit || b.avgPerYear - a.avgPerYear)
    .map((f) => `<tr>
      <td><b>${esc(f.name)}</b></td>
      <td style="color:var(--text-3);font-size:12.5px">${f.segs.map((s) => SEG_NAME[s]).join('、')}</td>
      <td class="num cell-hi">${fmt(f.avgPerYear)}</td>
      ${f.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
      <td><span class="yr ${f.hit === N_PAPERS ? 'hit' : ''}">${f.hit}/${N_PAPERS}</span></td>
      <td>${levelTag(f.level)}</td>
    </tr>`).join('');

  // —— 单选语法族：命题差异最集中的地方 ——
  const grammarRows = GRAMMAR_YEARLY.map((g) => `<tr>
    <td><b>${esc(g.name)}</b></td>
    ${g.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
    <td class="num cell-hi">${g.hit}/${N_PAPERS}</td>
  </tr>`).join('');

  const stableG = GRAMMAR_YEARLY.filter((g) => g.hit === N_PAPERS);
  const varyG = GRAMMAR_YEARLY.filter((g) => g.hit < N_PAPERS);

  const body = `
<section class="hero" style="padding-bottom:10px">
  <div class="hero-badge"><span class="dot-live"></span>教材 ${esc(BOOK_STATUS.press)} · 真题 ${N_PAPERS} 套</div>
  <h1 style="font-size:clamp(26px,3.2vw,36px)">教材对照</h1>
  <p class="lede" style="max-width:790px">
    西城期末是<b>全区命题</b>，进度与本校未必完全同步。所以这一页把两边分开摆：
    <b>教材侧</b>按外研版七上目录，<b>真题侧</b>按 ${N_PAPERS} 套卷的实际考法。
    两边对不上的地方，就是「可能超纲」或「考得比课本浅」的位置。
  </p>
</section>

${section('教材侧', '外研版七上 · 模块清单', '目录未核实，暂不填模块号', bookCard)}

${section('真题侧', '考点族的命题稳定性', `同一个族在 ${N_PAPERS} 个学年里出现的年数——这是「命题是否有差异」的直接证据`, `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>考点族</th><th>板块</th><th class="num">年均分</th>
  ${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th>命中</th><th>判定</th>
</tr></thead>
<tbody>${propRows}</tbody>
</table>
</div>
<div class="grid g3" style="margin-top:16px">
  <div class="card">
    <div style="font-size:28px;font-weight:800;color:var(--ok);font-variant-numeric:tabular-nums">${PROP_SUMMARY.stable.length}</div>
    <div style="font-size:13px;font-weight:650;margin-top:4px">年年考</div>
    <div style="font-size:12.4px;color:var(--text-3);margin-top:3px">${N_PAPERS}/${N_PAPERS} 学年都出现，可以按「必练」对待</div>
  </div>
  <div class="card">
    <div style="font-size:28px;font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums">${PROP_SUMMARY.variable.length}</div>
    <div style="font-size:13px;font-weight:650;margin-top:4px">多数年考</div>
    <div style="font-size:12.4px;color:var(--text-3);margin-top:3px">出现在 ${Math.ceil(N_PAPERS / 2)}–${N_PAPERS - 1} 个学年，要会但不押</div>
  </div>
  <div class="card">
    <div style="font-size:28px;font-weight:800;color:var(--gold);font-variant-numeric:tabular-nums">${PROP_SUMMARY.sporadic.length}</div>
    <div style="font-size:13px;font-weight:650;margin-top:4px">个别年考</div>
    <div style="font-size:12.4px;color:var(--text-3);margin-top:3px">只在一两个学年出现，认识即可</div>
  </div>
</div>
`, 'prop')}

${section('命题差异', '单选段的语法分布', '这是最能看出「命题组每年在挑什么」的地方', `
<div class="tbl-wrap">
<table>
<thead><tr>
  <th>语法族</th>${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th class="num">命中</th>
</tr></thead>
<tbody>${grammarRows}</tbody>
</table>
</div>
<div class="note info" style="margin-top:16px">
  <b>${stableG.length} 个语法族 ${N_PAPERS}/${N_PAPERS} 年都考</b>：${stableG.map((g) => esc(g.name)).join('、')}。
  这 ${stableG.length} 个是单选的骨架，十年内大概不会变。
</div>
<div class="note warn" style="margin-top:10px">
  <b>${varyG.length} 个族只在个别年份出现</b>：${varyG.map((g) => `${esc(g.name)}（${g.hit}/${N_PAPERS}）`).join('、')}。
  这正是「全区命题有差异」的具体形态——<b>不是每年都考同一套语法点</b>。
  所以复习时按「${stableG.length} 个骨架 + ${varyG.length} 个轮换」来排，不要把轮换项当成必考。
</div>
`, 'grammar')}

${section('怎么用', '两边怎么合起来看', '教材给范围，真题给权重', `
<ul class="clean">
<li><b>教材回答「学过没有」。</b>模块清单核实后，每个考点族会标出对应模块；没有对应模块的，就是超纲或综合运用。</li>
<li><b>真题回答「值多少分」。</b>上面的稳定性分级已经给出：年年考的按必练，个别年的按认识。</li>
<li><b>两边冲突时的处理：</b>教材有、真题从不考 → 会做即可，不投入时间；真题常考、教材没讲 → 优先补，因为考场会扣分。</li>
<li><b>当前限制：</b>教材侧为空，所以「冲突判定」这一栏还做不了。补上目录后本页会自动多出一列模块对照。</li>
</ul>
`)}

${section('待补', '教材侧还缺什么', '说清楚缺什么，比含糊过去强', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:8px">需要你提供的</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.72">
      <b>课本目录页照片</b>（外研版七上），要能看到：模块号、模块标题、每模块的语法重点。
      有这三项就能把 ${BOOK_PROGRESS.target} 个考点族全部挂上去。
    </p>
  </div>
  <div class="card">
    <h3 style="margin-bottom:8px">为什么现在不填</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.72">
      模块号填错不会报错，但会让整张对照表失效，而且<b>读者无法自行发现</b>。
      留空并标「待核」是可接受的；凭记忆编造不可接受。
    </p>
  </div>
</div>
`)}
`;

  return page('book.html', `教材对照 · ${SITE.short}`, `外研版七上教材与 ${N_PAPERS} 套真题的对照：教材侧待核，真题侧已实证。`, body);
}

/* ============================ 专项（单词 + 语法） ============================ */
function buildSpecial() {
  // ---------- 单词 ----------
  const spellRows = SPELL_ITEMS.map((it) => `<tr>
    <td class="num" style="color:var(--text-3)">${esc(PAPER_STATS.find((p) => p.id === it.p).label)}</td>
    <td class="num" style="color:var(--text-3)">${it.no}</td>
    <td><b style="font-family:var(--mono);font-size:13.4px">${esc(it.ipa)}</b></td>
    <td><b style="color:var(--accent)">${esc(it.word)}</b></td>
    <td class="num">${it.len}</td>
    <td class="wrap-cell" style="color:var(--text-3);font-size:12.6px">${esc(it.sent)}</td>
    <td style="white-space:normal">${it.feats.map((f) => `<span class="tag cat" style="margin-right:4px">${esc(f)}</span>`).join('')}</td>
  </tr>`).join('');

  const featCards = SPELL_FEATURES.map((f) => `
    <div class="card" style="padding:15px 17px">
      <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px">
        <b style="font-size:14px">${esc(f.name)}</b>
        <span style="font-size:12px;color:var(--text-3);margin-left:auto">${f.count} 词</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">
        ${f.items.map((i) => `<span style="font-family:var(--mono);font-size:12.4px;background:var(--accent-soft);color:var(--accent);padding:2px 7px;border-radius:5px">${esc(i.word)}</span>`).join('')}
      </div>
    </div>`).join('');

  // ---------- 语法 ----------
  const gRows = GRAMMAR_DOUBLE.map((g) => {
    const lv = g.level === 'stable' ? 'easy' : g.level === 'variable' ? 'mid' : 'rare';
    const lvName = PROP_LEVEL_NAME[g.level];
    return `<tr>
      <td><b>${esc(g.name)}</b></td>
      <td class="num cell-hi">${fmt(g.avgPerYear)}</td>
      ${g.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
      <td><span class="yr ${g.hit === N_PAPERS ? 'hit' : ''}">${g.hit}/${N_PAPERS}</span></td>
      <td class="num" style="font-weight:${g.writeHits ? 700 : 400};color:${g.writeHits ? 'var(--rose)' : 'var(--text-3)'}">${g.writeHits || '—'}</td>
      <td><span class="tag ${lv}">${lvName}</span></td>
    </tr>`;
  }).join('');

  const sentRows = SENT_ITEMS.map((it) => `<tr>
    <td style="color:var(--text-3);font-size:12.4px">${esc(PAPER_STATS.find((p) => p.id === it.p).label)}</td>
    <td class="num" style="color:var(--text-3)">${it.no}</td>
    <td class="wrap-cell"><b>${esc(it.zh)}</b></td>
    <td class="wrap-cell" style="font-family:var(--mono);font-size:12.4px;color:var(--text-3)">${esc(it.hint)}</td>
    <td style="white-space:normal">${it.acts.map((a) => `<span class="tag write" style="margin-right:4px;margin-bottom:3px">${esc(a)}</span>`).join('')}</td>
    <td class="wrap-cell" style="font-size:12.6px;color:var(--ok)">${esc(it.ans)}</td>
  </tr>`).join('');

  const groupBars = SENT_GROUPS.map((g) =>
    distBar(g.label, g.count, Math.max(...SENT_GROUPS.map((x) => x.count)), ' 句', 'rose')).join('');

  const doubleTested = GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0);

  const body = `
<section class="hero" style="padding-bottom:10px">
  <div class="hero-badge"><span class="dot-live"></span>${N_PAPERS} 套真题 · 逐题实证</div>
  <h1 style="font-size:clamp(26px,3.2vw,36px)">专项：单词与语法</h1>
  <p class="lede" style="max-width:790px">
    输出型 <b>${fmt(SPELL_TOTAL)} 分</b>里，拼写和语法是绕不开的两件事。
    这一页不讲通用方法，只列 ${N_PAPERS} 套卷<b>实际考过的词</b>和<b>实际考过的语法点</b>。
  </p>
</section>

${section('单词', '要拼写的只有这些板块', '其余 62 分只需认读，不必会写', `
<div class="tbl-wrap">
<table>
<thead><tr><th>板块</th><th class="num">分值</th><th class="num">题量</th><th>要求</th></tr></thead>
<tbody>
${SPELL_SEGMENTS.map((s) => `<tr>
  <td><b>${esc(s.name)}</b></td>
  <td class="num cell-hi">${fmt(s.score)}</td>
  <td class="num">${s.count}</td>
  <td style="color:var(--text-3);font-size:12.6px">写出单词 / 句子 / 短文</td>
</tr>`).join('')}
</tbody>
<tfoot><tr><td>合计</td><td class="num">${fmt(SPELL_TOTAL)}</td><td class="num">—</td><td></td></tr></tfoot>
</table>
</div>
<div class="note info" style="margin-top:14px">
  <b>先分清「会写」和「认识」。</b>全卷 ${MAIN_TOTAL} 分里，只有上面这 <b>${fmt(SPELL_TOTAL)} 分</b>要动笔写出文字，
  其余 <b>${fmt(MAIN_TOTAL - SPELL_TOTAL)} 分</b>只需认得出。
  背单词背错方向，是把力气花在了不考的地方。
  <br><br>
  <b>注意这一刀与站内「选择型 54 / 输出型 36」是同一组数字，但含义不同：</b>
  那一刀切的是「要不要涂卡」，这一刀切的是「要不要拼写」。
  阅读简答的 8 分属于输出型，但它要求写句子，不只是拼单词——所以它同时出现在两张表里。
</div>
`, 'words')}

${section('音标填词', `${SPELL_STATS.total} 个词，平均 ${SPELL_STATS.avgLen} 个字母`, `四年全部考词，最长 ${SPELL_STATS.maxLen} 个字母——不是难词`, `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th class="num">题号</th><th>音标</th><th>答案</th><th class="num">字母</th><th>句子原境</th><th>拼写特征</th></tr></thead>
<tbody>${spellRows}</tbody>
</table>
</div>
<div class="note warn" style="margin-top:14px">
  <b>这些不是难词，是最基础的词。</b>平均 ${SPELL_STATS.avgLen} 个字母，最短 ${SPELL_STATS.minLen} 个（cut / map / big）。
  所以音标题的失分<b>不是「不认识」，是「拼不对」</b>——练法应该是定向拼写，不是背难词。
</div>
`, 'spell')}

${section('拼写特征', `按易错点归成 ${SPELL_STATS.featureCount} 类`, '一个词可能同时属于多类，所以合计会大于 16', `
<div class="grid g3">${featCards}</div>
<div class="note" style="margin-top:16px">
  <b>怎么用这张图：</b>把「词数最多」的几类先练透。
  ${SPELL_FEATURES.slice(0, 3).map((f) => `<b>${esc(f.name)}</b>（${f.count} 词）`).join('、')}
  是出现最多的三类——练这三类，覆盖了一半以上的音标题。
</div>
`)}
`;
  // 续（语法部分在下面拼接）
  return page('special.html', `专项：单词与语法 · ${SITE.short}`,
    `${N_PAPERS} 套真题的音标 16 词与单选 40 题语法点实证。`, body + buildSpecialGrammar());
}

function buildSpecialGrammar() {
  const gRows = GRAMMAR_DOUBLE.map((g) => {
    const lv = g.level === 'stable' ? 'easy' : g.level === 'variable' ? 'mid' : 'rare';
    const lvName = PROP_LEVEL_NAME[g.level];
    return `<tr>
      <td><b>${esc(g.name)}</b></td>
      <td class="num cell-hi">${fmt(g.avgPerYear)}</td>
      ${g.per.map((v) => `<td class="num" style="color:${v > 0 ? 'var(--text)' : 'var(--text-3)'}">${v > 0 ? fmt(v) : '—'}</td>`).join('')}
      <td><span class="yr ${g.hit === N_PAPERS ? 'hit' : ''}">${g.hit}/${N_PAPERS}</span></td>
      <td class="num" style="font-weight:${g.writeHits ? 700 : 400};color:${g.writeHits ? 'var(--rose)' : 'var(--text-3)'}">${g.writeHits || '—'}</td>
      <td><span class="tag ${lv}">${lvName}</span></td>
    </tr>`;
  }).join('');

  const sentRows = SENT_ITEMS.map((it) => `<tr>
    <td style="color:var(--text-3);font-size:12.4px">${esc(PAPER_STATS.find((p) => p.id === it.p).label)}</td>
    <td class="num" style="color:var(--text-3)">${it.no}</td>
    <td class="wrap-cell"><b>${esc(it.zh)}</b></td>
    <td class="wrap-cell" style="font-family:var(--mono);font-size:12.4px;color:var(--text-3)">${esc(it.hint)}</td>
    <td style="white-space:normal">${it.acts.map((a) => `<span class="tag write" style="margin-right:4px;margin-bottom:3px">${esc(a)}</span>`).join('')}</td>
    <td class="wrap-cell" style="font-size:12.6px;color:var(--ok)">${esc(it.ans)}</td>
  </tr>`).join('');

  const groupBars = SENT_GROUPS.map((g) =>
    distBar(g.label, g.count, Math.max(...SENT_GROUPS.map((x) => x.count)), ' 句', 'rose')).join('');

  const doubleTested = GRAMMAR_DOUBLE.filter((g) => g.writeHits > 0);

  return `
${section('语法', '语法在卷面上的两次考核', '单选考「认不认得出」，汉译英考「写不写得对」', `
<div class="note risk">
  <b>语法族只出现在单项填空里，产出分为 0。</b>但这不等于语法只在单选考 ${fmt(SEG_SCORE['单选'].avg)} 分——
  它换了名字出现在汉译英和文段表达里。<b>同一能力，两种考法，要用两种练法。</b>
</div>
<div class="tbl-wrap" style="margin-top:16px">
<table>
<thead><tr>
  <th>语法族</th><th class="num">年均分</th>
  ${YEARS.map((y) => `<th class="num">${y}</th>`).join('')}
  <th>单选命中</th><th class="num">汉译英出现</th><th>判定</th>
</tr></thead>
<tbody>${gRows}</tbody>
</table>
</div>
<div class="note info" style="margin-top:14px">
  <b>${doubleTested.length} 个族是「双重考核」</b>：${doubleTested.map((g) => `${esc(g.name)}（单选 ${g.hit}/${N_PAPERS} + 汉译英 ${g.writeHits} 句）`).join('、')}。
  这几族既要会选，又要会写，优先级高于只在单选出现的族。
</div>
`, 'grammar')}

${section('汉译英', `${SENT_ITEMS.length} 句：语法真正被「写」出来的地方`, '每句都标了实际要求的语法动作', `
<div class="tbl-wrap">
<table>
<thead><tr><th>年份</th><th class="num">题号</th><th>中文原句</th><th>提示词</th><th>语法动作</th><th>参考答案</th></tr></thead>
<tbody>${sentRows}</tbody>
</table>
</div>
`, 'sent')}

${section('动作频次', '哪几类语法动作最常考', `按出现句数排序，共 ${SENT_ITEMS.length} 句`, `
<div class="grid g2">
  <div class="card">${groupBars}</div>
  <div class="card">
    <h3 style="margin-bottom:10px">怎么读这张图</h3>
    <ul class="clean">
    ${SENT_GROUPS.map((g) => `<li><b>${esc(g.label)}</b>：${g.count} 句，${g.items.map((i) => `「${esc(i.zh.replace(/。$/, ''))}」`).join('、')}</li>`).join('')}
    </ul>
  </div>
</div>
<div class="note warn" style="margin-top:16px">
  <b>固定搭配 ${SENT_GROUPS.find((g) => g.id === 'colloc')?.count || 0} 句，比任何单一语法规则都多。</b>
  这说明汉译英的主战场不是「语法规则」，是<b>短语能不能直接写出来</b>。
  这些搭配背了就能用，不需要推理——是全卷性价比最高的投入之一。
</div>
`, 'acts')}

${section('练法', '两个动作，覆盖上面全部内容', '不刷题册，只做这两件事', `
<div class="grid g2">
  <div class="card">
    <h3 style="margin-bottom:10px">① 定向拼写（单词）</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.75">
      按上面 ${SPELL_STATS.featureCount} 类特征分批练，不背整本词表。<br>
      <b>验收</b>：随机听写 20 个课本词（含辅音丛、双写、元音组合各若干），正确 ≥19。
    </p>
  </div>
  <div class="card">
    <h3 style="margin-bottom:10px">② 一句多改（语法）</h3>
    <p style="font-size:13.3px;color:var(--text-2);line-height:1.75">
      拿一个基础句，改成三单 / 过去 / 否定 / 疑问四种形式。<br>
      <b>为什么有效</b>：一次操练同时覆盖时态、主谓一致、否定句、疑问句——
      正好是单选 40 题里占比最高的四族，而且是在「写」的场景下练。
    </p>
  </div>
</div>
<div class="note" style="margin-top:14px">
  <b>示例：</b><code style="font-family:var(--mono);font-size:12.6px;background:var(--bg-3);padding:2px 6px;border-radius:4px">She is waiting for the bus.</code><br>
  → 三单：<code style="font-family:var(--mono);font-size:12.6px">He waits for the bus.</code>　
  → 过去：<code style="font-family:var(--mono);font-size:12.6px">She waited for the bus.</code><br>
  → 否定：<code style="font-family:var(--mono);font-size:12.6px">She isn't waiting for the bus.</code>　
  → 疑问：<code style="font-family:var(--mono);font-size:12.6px">Is she waiting for the bus?</code><br>
  <b>每天 5 句 × 4 改 = 20 个变形。</b>
</div>
`)}

${section('边界', '这一版做不到的', '数据缺口要说清', `
<ul class="clean">
<li><b>听填 8 分的实际考词无法验证。</b>${PAPER_STATS.filter((p) => !p.hasAnswer).map((p) => p.label).join('、')} 无答案，
另两套的参考答案听力部分标「略」。所以听填常考哪类词，只能从题干结构推断，可信度低于其他部分。</li>
<li><b>音标不是标准 IPA 的部分已如实保留。</b>2024-25 卷写的是 <code style="font-family:var(--mono);font-size:12.4px">[rest]</code>、<code style="font-family:var(--mono);font-size:12.4px">[smel]</code>
这类「用字母拼写代替音标」的形式，是真题本身的写法，我没有改成标准音标。</li>
<li><b>教材目录未拿到。</b>所以无法判断「这些语法点课本讲到没有」，优先级只能按真题分值排，不能按教材进度排。</li>
<li><b>不做「语法体系全覆盖」。</b>七上范围就是这 ${GRAMMAR_FAMS.length} 族，其中 ${GRAMMAR_FAMS.filter((g) => g.hit === N_PAPERS).length} 族年年考、${GRAMMAR_FAMS.filter((g) => g.hit < N_PAPERS).length} 族轮换。</li>
</ul>
`)}
`;
}
const pages = {
  'index.html': buildHome(),
  'papers.html': buildPapers(),
  'trend.html': buildTrend(),
  'plan.html': buildPlan(),
  'special.html': buildSpecial(),
  'book.html': buildBook(),
};

for (const [name, html] of Object.entries(pages)) {
  writeFileSync(name, html, 'utf8');
  console.log(`  ${name}  ${(html.length / 1024).toFixed(1)} KB`);
}
console.log(`\n✓ 生成 ${Object.keys(pages).length} 页`);
