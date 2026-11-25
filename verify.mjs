#!/usr/bin/env node
// 校验：页面上的关键数字必须能从台账重算出来。
// 与数学站同一条纪律——「不许写算不出来的断言」。
import { readFileSync } from 'node:fs';
import {
  PAPER_STATS, YEARS, N_PAPERS, SEG_SCORE, CAT_SCORE, DIFF_SCORE, MODE_SCORE,
  FAM_MAP, FREQ_SUMMARY,
  PROP_STABILITY, PROP_SUMMARY, GRAMMAR_YEARLY,
  SPELL_ITEMS, SPELL_FEATURES, SPELL_STATS, SPELL_SEGMENTS, SPELL_TOTAL,
  GRAMMAR_FAMS, SENT_ITEMS, SENT_GROUPS, GRAMMAR_DOUBLE,
} from './work/papers/stats.mjs';
import { LEDGER, SEG_ORDER, CAT_ORDER, DIFF_ORDER } from './work/papers/ledger.mjs';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const ALL_PAGES = ['index.html', 'papers.html', 'trend.html', 'special.html', 'plan.html'];

let fail = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fail++;
};

/* ---------- 1. 台账自洽 ---------- */
for (const p of PAPER_STATS) {
  ok(Math.abs(p.mainTotal - 90) < 1e-9, `${p.label} 必做合计 90 分（实为 ${p.mainTotal}）`);
  ok(p.mainCount === 55, `${p.label} 必做 55 小题（实为 ${p.mainCount}）`);
  ok(p.bonusTotal === 10, `${p.label} 选做 10 分（实为 ${p.bonusTotal}）`);
}

/* ---------- 1b. 学年与考试日期自洽（此前版本整体错一年） ---------- */
for (const p of PAPER_STATS) {
  const examYear = Number(p.examDate.split('.')[0]);
  ok(p.year === `${examYear - 1}—${examYear}`,
    `${p.label} 学年「${p.year}」与卷面 ${p.examDate} 自洽`);
}
{
  const ys = PAPER_STATS.map((p) => Number(p.examDate.split('.')[0])).sort((a, b) => a - b);
  const gaps = ys.slice(1).map((y, i) => y - ys[i]).filter((d) => d !== 1);
  ok(gaps.length === 0, `样本年份连续无断档（${ys[0]}–${ys[ys.length - 1]}）`);
}

/* ---------- 2. 选择型 + 输出型 = 90 ---------- */
ok(Math.abs(MODE_SCORE.select.avg + MODE_SCORE.write.avg - 90) < 1e-9,
  `选择型 ${fmt(MODE_SCORE.select.avg)} + 输出型 ${fmt(MODE_SCORE.write.avg)} = 90`);

/* ---------- 3. 十个板块分值加总 = 90 ---------- */
for (const p of PAPER_STATS) {
  const t = sum(SEG_ORDER.map((k) => p.seg[k] || 0));
  ok(Math.abs(t - 90) < 1e-9, `${p.label} 十个板块分值加总 = 90（实为 ${t}）`);
}

/* ---------- 4. 能力 / 难度加总 = 90 ---------- */
for (const p of PAPER_STATS) {
  const c = sum(CAT_ORDER.map((k) => p.cat[k] || 0));
  const d = sum(DIFF_ORDER.map((k) => p.diff[k] || 0));
  ok(Math.abs(c - 90) < 1e-9, `${p.label} 能力加总 = 90（实为 ${c}）`);
  ok(Math.abs(d - 90) < 1e-9, `${p.label} 难度加总 = 90（实为 ${d}）`);
}

/* ---------- 5. 考点族加总 = 90（每年） ---------- */
for (const p of PAPER_STATS) {
  const t = sum(Object.values(p.fam));
  ok(Math.abs(t - 90) < 1e-9, `${p.label} 考点族分值加总 = 90（实为 ${t}）`);
}

/* ---------- 6. 页面上的数字真的出现在 HTML 里 ---------- */
const checkIn = (file, needles) => {
  const html = readFileSync(file, 'utf8');
  for (const n of needles) {
    ok(html.includes(n), `${file} 含「${n}」`);
  }
};

const MAIN_TOTAL = PAPER_STATS[0].mainTotal;
const SELECT = fmt(MODE_SCORE.select.avg);
const WRITE = fmt(MODE_SCORE.write.avg);
const BASE_MID = +(DIFF_SCORE.easy.avg + DIFF_SCORE.mid.avg).toFixed(1);
const BASE_MID_PCT = Math.round(((DIFF_SCORE.easy.avg + DIFF_SCORE.mid.avg) / MAIN_TOTAL) * 100);

checkIn('index.html', [
  `${MAIN_TOTAL}</b><span>必做满分</span>`,
  `${SELECT}</span>`,
  `${WRITE}</span>`,
  `${fmt(BASE_MID)}`,
  `${BASE_MID_PCT}%`,
  `${LEDGER.length} 题逐题标注`,
]);

/* ---------- 7. 不许出现的硬编码谎话 ---------- */
// 样本只有 3 套，任何「五年」「4 套」都是错的
for (const f of ALL_PAGES) {
  const html = readFileSync(f, 'utf8');
  // 套数/学年数只能等于 N_PAPERS。
  // 只拦「样本量」口径的说法（样本 N 套 / 共 N 套 / 只有 N 套），
  // 不拦「另 3 套 57 题」这类对卷面事实的描述——那是数据，不是过期文案。
  const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八'];
  const SAMPLE_CTX = ['样本', '共 ', '只有', '仅 ', '已有', '手上'];
  const flagCount = (needle) => {
    const hits = [];
    let i = -1;
    while ((i = html.indexOf(needle, i + 1)) !== -1) {
      const ctx = html.slice(Math.max(0, i - 10), i);
      if (SAMPLE_CTX.some((c) => ctx.includes(c))) hits.push(ctx.replace(/<[^>]+>/g, ''));
    }
    return hits;
  };
  for (let n = 1; n <= 8; n++) {
    if (n === N_PAPERS) continue;
    ok(flagCount(`${n} 套`).length === 0, `${f} 无「样本 ${n} 套」类过期说法（实为 ${N_PAPERS} 套）`);
    ok(flagCount(`${CN[n]}年`).length === 0, `${f} 无「${CN[n]}年」类过期说法（实为 ${N_PAPERS} 学年）`);
  }

  // 「必考」只允许出现在否定语境里（如「不能证明年年必考」「不用必考/偶考标签」）。
  // 正向断言「XX 是必考点」在 3 套样本下无据，必须拦下。
  // 「必考」出现在这些语境里是合法的，不算正向断言：
  //   ① 被引号包住（「必考」标签）——是引用术语名，不是断言某考点必考
  //   ② 前面 14 字符内有否定词（不能证明年年必考 / 不用必考标签）
  const NEG = ['不', '无法', '不能', '非'];
  const bad = [];
  let i = -1;
  while ((i = html.indexOf('必考', i + 1)) !== -1) {
    const before = html.slice(Math.max(0, i - 14), i);
    const after = html.slice(i + 2, i + 3);
    const quoted = before.trimEnd().endsWith('「') || after === '」';
    if (quoted) continue;
    if (!NEG.some((n) => before.includes(n))) bad.push(before.replace(/<[^>]+>/g, '') + '必考');
  }
  ok(bad.length === 0, `${f} 无正向「必考」断言${bad.length ? `（发现：${bad.join(' / ')}）` : ''}`);
}

/* ---------- 8. 频次标签必须与数据一致 ---------- */
const alwaysN = FREQ_SUMMARY.always.length;
const famN = FAM_MAP.filter((f) => !f.onlyBonus).length;
ok(alwaysN <= famN, `always 族数 ${alwaysN} ≤ 必做族数 ${famN}`);
// 3 套样本下如果 always 占比过高，页面必须已经写明「标签没有区分度」
{
  const html = readFileSync('index.html', 'utf8');
  const ratio = alwaysN / famN;
  if (ratio > 0.6) {
    ok(/主排序/.test(html) && /分值/.test(html),
      `always 占比 ${Math.round(ratio * 100)}%，首页已说明「主排序用分值」`);
  }
}

/* ---------- 9. 能力/难度占比自洽 ---------- */
for (const k of CAT_ORDER) {
  const pct = Math.round((CAT_SCORE[k].avg / MAIN_TOTAL) * 100);
  ok(pct === CAT_SCORE[k].pct, `能力「${k}」占比 ${CAT_SCORE[k].pct}% 与均值自洽`);
}
for (const k of DIFF_ORDER) {
  const pct = Math.round((DIFF_SCORE[k].avg / MAIN_TOTAL) * 100);
  ok(pct === DIFF_SCORE[k].pct, `难度「${k}」占比 ${DIFF_SCORE[k].pct}% 与均值自洽`);
}

/* ---------- 9b. 能力轴不得是板块轴的纯函数 ---------- */
// 若某个板块的题全部落在同一个能力层，且每个板块都如此，则「能力」只是「板块」的改名，
// 三年极差必然为 0——那种「三年零波动」是标注口径造成的假发现，不是卷面事实。
{
  const segs = [...new Set(LEDGER.filter((q) => !q.bonus).map((q) => q.seg))];
  const uniformSegs = segs.filter((s) => {
    const cats = new Set(LEDGER.filter((q) => q.seg === s && !q.bonus).map((q) => q.cat));
    return cats.size === 1;
  });
  ok(uniformSegs.length < segs.length,
    `能力轴不是板块轴的纯函数（${segs.length} 个板块中 ${uniformSegs.length} 个能力单一，未全部退化）`);

  // 能力分布的逐年极差若全为 0，说明这条轴没有独立信号
  const allZero = CAT_ORDER.every((k) => CAT_SCORE[k].range === 0);
  ok(!allZero, `能力分布逐年存在差异（非全部极差为 0）`);
}

/* ---------- 10. 页面间数字一致 ---------- */
{
  const idx = readFileSync('index.html', 'utf8');
  const trend = readFileSync('trend.html', 'utf8');
  const plan = readFileSync('plan.html', 'utf8');
  ok(idx.includes(`${WRITE} 分`), `首页出现输出端 ${WRITE} 分`);
  ok(trend.includes(`${WRITE}`), `趋势页出现输出端 ${WRITE}`);
  ok(plan.includes(`${WRITE}`), `计划页出现输出端 ${WRITE}`);
}

/* ---------- 10b. 不得残留未渲染的模板占位符 ---------- */
// 单引号字符串里的 ${...} 不会插值，会原样输出到页面。
for (const f of ALL_PAGES) {
  const html = readFileSync(f, 'utf8');
  const left = html.match(/\$\{[A-Za-z_][A-Za-z0-9_]*\}/g) || [];
  ok(left.length === 0, `${f} 无未渲染的模板占位符（发现 ${left.length} 处${left.length ? '：' + [...new Set(left)].join(', ') : ''}）`);
}

/* ---------- 10d. 命题稳定性分级与数据一致 ---------- */
{
  const sum3 = PROP_SUMMARY.stable.length + PROP_SUMMARY.variable.length + PROP_SUMMARY.sporadic.length;
  ok(sum3 === PROP_STABILITY.length, `稳定性三档合计 ${sum3} = 必做族数 ${PROP_STABILITY.length}`);
  ok(PROP_SUMMARY.stable.every((f) => f.hit === N_PAPERS), '「年年考」档的命中数都等于样本数');
  ok(PROP_SUMMARY.variable.every((f) => f.hit < N_PAPERS), '「多数年考」档的命中数都小于样本数');
  const html = readFileSync('trend.html', 'utf8');
  ok(html.includes(`${PROP_SUMMARY.stable.length}`), `trend.html 显示年年考族数 ${PROP_SUMMARY.stable.length}`);
  // 单选语法族的命中数必须与考点族表一致
  for (const g of GRAMMAR_YEARLY) {
    const f = FAM_MAP.find((x) => x.id === g.id);
    ok(!!f && f.hit === g.hit, `单选族「${g.name}」命中数 ${g.hit} 与总表一致`);
  }
}

/* ---------- 10e. 专项页：数字必须能追溯到台账 ---------- */
{
  const html = readFileSync('special.html', 'utf8');

  // 音标词：16 个全部出现在页面上，且 IPA 与答案成对
  ok(SPELL_ITEMS.length === 16, `音标词 ${SPELL_ITEMS.length} 个（四套 × 4 题）`);
  for (const it of SPELL_ITEMS) {
    ok(html.includes(it.word) && html.includes(it.ipa), `音标「${it.word} ${it.ipa}」出现在页面上`);
  }
  ok(SPELL_ITEMS.every((i) => i.ipa && i.sent && i.feats.length),
    '每个音标词都有 IPA、句子原境、拼写特征');

  // 拼写特征覆盖必须完整：每个词至少 1 类
  ok(SPELL_FEATURES.length >= 5, `拼写特征 ${SPELL_FEATURES.length} 类（≥5）`);
  const covered = new Set(SPELL_FEATURES.flatMap((f) => f.items.map((i) => i.word)));
  ok(covered.size === SPELL_ITEMS.length, `全部 ${SPELL_ITEMS.length} 个词都被特征覆盖（${covered.size}）`);

  // 汉译英：12 句全部上页，且每句有中文、动作、答案
  ok(SENT_ITEMS.length === 12, `汉译英 ${SENT_ITEMS.length} 句（四套 × 3 题）`);
  ok(SENT_ITEMS.every((i) => i.zh && i.acts.length && i.ans), '每句汉译英都有中文、语法动作、参考答案');
  for (const it of SENT_ITEMS) ok(html.includes(it.zh), `汉译英「${it.zh}」出现在页面上`);

  // 语法双重考核：汉译英里出现的族必须真的在 SENT_ITEMS 里
  for (const g of GRAMMAR_DOUBLE.filter((x) => x.writeHits > 0)) {
    ok(g.writeHits <= SENT_ITEMS.length, `「${g.name}」汉译英 ${g.writeHits} 句 ≤ ${SENT_ITEMS.length}`);
  }
  const doubleN = GRAMMAR_DOUBLE.filter((x) => x.writeHits > 0).length;
  ok(html.includes(`${doubleN} 个族是「双重考核」`), `页面声明双重考核 ${doubleN} 个族`);

  // 写死数字排查
  ok(html.includes(`${SPELL_STATS.total} 个词`), `页面显示音标词数 ${SPELL_STATS.total}`);
  ok(html.includes(`平均 ${SPELL_STATS.avgLen} 个字母`), `页面显示平均字母数 ${SPELL_STATS.avgLen}`);
}

/* ---------- 10f. 2024-25 卷题号必须分段重编，不得沿用连续编号 ---------- */
{
  // 该卷听力后重新编号：单选 1-10、完形 11-20、阅读 21-35、音标 36-39、汉译英 40-42、作文 43、选做 44-50
  const q = LEDGER.filter((x) => x.p === 'p2425');
  const segNums = {};
  for (const x of q) { (segNums[x.seg] = segNums[x.seg] || []).push(x.no); }
  const check = (seg, expect) => {
    const got = [...new Set(segNums[seg] || [])].sort((a, b) => a - b);
    ok(JSON.stringify(got) === JSON.stringify(expect), `p2425 ${seg} 题号为 ${expect.join(',')}（实为 ${got.join(',')}）`);
  };
  check('单选', [1,2,3,4,5,6,7,8,9,10]);
  check('完形选词', [11,12,13,14]);
  check('完形选择', [15,16,17,18,19,20]);
  check('阅读简答', [32,33,34,35]);
  check('音标填词', [36,37,38,39]);
  check('汉译英', [40,41,42]);
  check('文段表达', [43]);
}

/* ---------- 10g. 导航标签必须全站一致 ---------- */
{
  // 标签只在一处定义（NAV），六页都应由它生成。改名时若漏改任何一处，这里会拦下。
  const NAV_LABELS = ['总览', '逐年真题', '趋势与考点', '专项', '冲刺计划'];
  for (const f of ALL_PAGES) {
    const html = readFileSync(f, 'utf8');
    const missing = NAV_LABELS.filter((l) => !html.includes(`>${l}</a>`));
    ok(missing.length === 0, `${f} 导航含全部 ${NAV_LABELS.length} 项${missing.length ? `（缺：${missing.join('、')}）` : ''}`);
  }
  // 旧标签不得残留
  for (const f of ALL_PAGES) {
    const html = readFileSync(f, 'utf8');
    ok(!html.includes('满分计划'), `${f} 无旧标签「满分计划」`);
  }
  // 首页「样本边界」整节已按用户要求删除，不得复活
  const idx = readFileSync('index.html', 'utf8');
  ok(!idx.includes('这一版明确做不到'), '首页不含已删除的「样本边界」节');
}

/* ---------- 10h. 已按用户要求移除的模块不得复活 ---------- */
{
  // 用户先后要求删除：首页「样本边界」节、全站「边界」模块、整页「教材对照」
  for (const f of ALL_PAGES) {
    const html = readFileSync(f, 'utf8');
    ok(!html.includes('这一版明确做不到'), `${f} 无「样本边界」节`);
    ok(!html.includes('这一版做不到'), `${f} 无「边界」节`);
    ok(!html.includes('这一版明确不做'), `${f} 无「边界」节（冲刺计划）`);
    ok(!html.includes('教材对照'), `${f} 无「教材对照」`);
  }
  // book.html 不应再生成
  const exists = (() => { try { readFileSync('book.html'); return true; } catch { return false; } })();
  ok(!exists, 'book.html 已删除且不再生成');
}

/* ---------- 11. 页面不得残留裸 Markdown ---------- */
// esc() 不解析 Markdown，漏网的 ** 会原样显示成星号。
for (const f of ALL_PAGES) {
  const html = readFileSync(f, 'utf8');
  const n = (html.match(/\*\*/g) || []).length;
  ok(n === 0, `${f} 无裸 Markdown 星号（发现 ${n} 处）`);
}

console.log(`\n${fail === 0 ? '✓ 全部通过' : `✗ ${fail} 项未通过`}`);
process.exit(fail === 0 ? 0 : 1);
