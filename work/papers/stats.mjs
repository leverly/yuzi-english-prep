// 统计派生层：页面与报告的所有数字都从这里算，不写常量。
// 纪律：写任何汇总句前先问「这个数字能从这个文件的数据算出来吗」。
import {
  LEDGER, PAPERS_META, FAM_DEFS, FAM_NAME, TEXTBOOK, TEXTBOOK_READY,
  SEG_ORDER, SEG_NAME, CAT_ORDER, CAT_NAME, DIFF_ORDER, DIFF_NAME, MODE_NAME,
} from './ledger.mjs';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const range = (a) => Math.max(...a) - Math.min(...a);

export const N_PAPERS = PAPERS_META.length;

// 维度顺序与名称原样透出，页面不必再 import 一次 ledger
export { SEG_ORDER, SEG_NAME, CAT_ORDER, CAT_NAME, DIFF_ORDER, DIFF_NAME, MODE_NAME, FAM_NAME };
export { TEXTBOOK, TEXTBOOK_READY };

/* ============================ 完备性断言 ============================ */
// 与数学站同一条纪律：数据自相矛盾时直接崩，不要静默产出错页面。
{
  const famIds = new Set(FAM_DEFS.map((f) => f.id));
  const badFam = LEDGER.filter((q) => !famIds.has(q.fam));
  if (badFam.length) throw new Error(`台账有 ${badFam.length} 题引用了未定义的考点族：${[...new Set(badFam.map((q) => q.fam))].join(', ')}`);

  const badSeg = LEDGER.filter((q) => !SEG_ORDER.includes(q.seg));
  if (badSeg.length) throw new Error(`台账有未定义的板块：${[...new Set(badSeg.map((q) => q.seg))].join(', ')}`);

  const badCat = LEDGER.filter((q) => !CAT_ORDER.includes(q.cat));
  if (badCat.length) throw new Error(`台账有未定义的能力层次：${[...new Set(badCat.map((q) => q.cat))].join(', ')}`);

  const badDiff = LEDGER.filter((q) => !DIFF_ORDER.includes(q.diff));
  if (badDiff.length) throw new Error(`台账有未定义的难度：${[...new Set(badDiff.map((q) => q.diff))].join(', ')}`);

  const badMode = LEDGER.filter((q) => !['select', 'write'].includes(q.mode));
  if (badMode.length) throw new Error(`台账有未定义的作答方式：${[...new Set(badMode.map((q) => q.mode))].join(', ')}`);

  // 每套卷必做必须 90 分 / 55 题 —— 这是卷面事实，对不上说明台账抄错了
  for (const meta of PAPERS_META) {
    const main = LEDGER.filter((q) => q.p === meta.id && !q.bonus);
    const total = sum(main.map((q) => q.score));
    if (Math.abs(total - 90) > 1e-9) throw new Error(`${meta.label} 必做合计 ${total} 分，应为 90 分`);
    if (main.length !== 55) throw new Error(`${meta.label} 必做 ${main.length} 小题，应为 55 小题`);
  }

  // 每个考点族的 seg 必须与台账里实际出现的 seg 相容
  for (const f of FAM_DEFS) {
    const used = new Set(LEDGER.filter((q) => q.fam === f.id).map((q) => q.seg));
    const extra = [...used].filter((s) => !f.seg.includes(s));
    if (extra.length) throw new Error(`考点族「${f.name}」声明板块 ${f.seg.join('/')}，但台账里出现在 ${extra.join('/')}`);
  }

  // 学年必须与卷面考试日期自洽：学年 = 考试年份 - 1 起，到考试年份止。
  // 文件名里的年份是「考试举行年份」，直接当学年会整体错一年（此前版本踩过）。
  for (const meta of PAPERS_META) {
    const m = /^(\d{4})\.(\d{1,2})$/.exec(meta.examDate || '');
    if (!m) throw new Error(`${meta.label} 缺少合法的 examDate（如 2024.1）`);
    const examYear = Number(m[1]);
    const expect = `${examYear - 1}—${examYear}`;
    if (meta.year !== expect) {
      throw new Error(`${meta.label} 学年写成「${meta.year}」，但卷面是 ${meta.examDate} 考，应为「${expect}」`);
    }
  }

  // 学年之间不得重复，且必须连续 —— 断年说明漏卷或标错
  const examYears = PAPERS_META.map((p) => Number(p.examDate.split('.')[0])).sort((a, b) => a - b);
  if (new Set(examYears).size !== examYears.length) throw new Error('PAPERS_META 里有重复的考试年份');
  for (let i = 1; i < examYears.length; i++) {
    if (examYears[i] - examYears[i - 1] !== 1) {
      throw new Error(`样本年份不连续：${examYears[i - 1]} 与 ${examYears[i]} 之间断档`);
    }
  }
}

/* ============================ 逐卷统计 ============================ */
export const PAPER_STATS = PAPERS_META.map((meta) => {
  const qs = LEDGER.filter((q) => q.p === meta.id);
  const main = qs.filter((q) => !q.bonus);
  const bonus = qs.filter((q) => q.bonus);

  const seg = {}, segN = {}, cat = {}, catN = {}, diff = {}, diffN = {}, mode = {}, modeN = {}, fam = {};
  for (const q of main) {
    seg[q.seg] = (seg[q.seg] || 0) + q.score;
    segN[q.seg] = (segN[q.seg] || 0) + 1;
    cat[q.cat] = (cat[q.cat] || 0) + q.score;
    catN[q.cat] = (catN[q.cat] || 0) + 1;
    diff[q.diff] = (diff[q.diff] || 0) + q.score;
    diffN[q.diff] = (diffN[q.diff] || 0) + 1;
    mode[q.mode] = (mode[q.mode] || 0) + q.score;
    modeN[q.mode] = (modeN[q.mode] || 0) + 1;
    fam[q.fam] = (fam[q.fam] || 0) + q.score;
  }

  // 难度指数：easy 1 / mid 2 / hard 3，按分值加权后归一到 90 分口径
  const W = { easy: 1, mid: 2, hard: 3 };
  const diffIndex = +(sum(main.map((q) => W[q.diff] * q.score)) / 90).toFixed(2);

  return {
    ...meta,
    qCount: qs.length,
    mainCount: main.length,
    bonusCount: bonus.length,
    mainTotal: sum(main.map((q) => q.score)),
    bonusTotal: sum(bonus.map((q) => q.score)),
    seg, segN, cat, catN, diff, diffN, mode, modeN, fam, diffIndex,
  };
});

export const YEARS = PAPER_STATS.map((s) => s.label);

/* ============================ 板块：跨年汇总 ============================ */
export const SEG_SCORE = {};
for (const k of SEG_ORDER) {
  const per = PAPER_STATS.map((s) => s.seg[k] || 0);
  const perN = PAPER_STATS.map((s) => s.segN[k] || 0);
  const total = sum(per);
  SEG_SCORE[k] = {
    id: k, name: SEG_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 90)) * 100),
    fixed: range(per) === 0,
  };
}

/* ============================ 能力层次：跨年汇总 ============================ */
export const CAT_SCORE = {};
for (const k of CAT_ORDER) {
  const per = PAPER_STATS.map((s) => s.cat[k] || 0);
  const perN = PAPER_STATS.map((s) => s.catN[k] || 0);
  const total = sum(per);
  CAT_SCORE[k] = {
    id: k, name: k, per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 90)) * 100),
  };
}

/* ============================ 难度：跨年汇总 ============================ */
export const DIFF_SCORE = {};
for (const k of DIFF_ORDER) {
  const per = PAPER_STATS.map((s) => s.diff[k] || 0);
  const perN = PAPER_STATS.map((s) => s.diffN[k] || 0);
  const total = sum(per);
  DIFF_SCORE[k] = {
    id: k, name: DIFF_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 90)) * 100),
  };
}

/* ============================ 作答方式：选择型 vs 输出型 ============================ */
// 这是本站的核心切口：同样是 90 分，一半只涂卡，一半要写出文字。
export const MODE_SCORE = {};
for (const k of ['select', 'write']) {
  const per = PAPER_STATS.map((s) => s.mode[k] || 0);
  const perN = PAPER_STATS.map((s) => s.modeN[k] || 0);
  const total = sum(per);
  MODE_SCORE[k] = {
    id: k, name: MODE_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 90)) * 100),
    fixed: range(per) === 0,
  };
}
// 输出型板块清单（由数据派生，不手写）
export const WRITE_SEGS = SEG_ORDER.filter((s) =>
  LEDGER.filter((q) => q.seg === s && !q.bonus).every((q) => q.mode === 'write'));

/* ============================ 考点族：跨年汇总 ============================ */
export const FAM_MAP = FAM_DEFS.map((f) => {
  const qs = LEDGER.filter((q) => q.fam === f.id && !q.bonus);
  const per = PAPER_STATS.map((s) => s.fam[f.id] || 0);
  const hit = per.filter((v) => v > 0).length;
  const total = sum(per);
  const bonusOnly = qs.length === 0 && LEDGER.some((q) => q.fam === f.id && q.bonus);
  return {
    ...f,
    qs,
    per,
    hit,
    total,
    avgPerYear: +(total / N_PAPERS).toFixed(1),
    perYearHit: +(hit / N_PAPERS).toFixed(2),
    onlyBonus: bonusOnly,
  };
}).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'zh'));

export const famById = (id) => FAM_MAP.find((f) => f.id === id);

// 频次三档：样本只有 3 套，门槛随之收紧。
// 纪律：不许写「必考」以外的绝对断言，且「必考」只在 3/3 时才成立。
export const FREQ_RULE = { always: N_PAPERS, often: Math.max(2, N_PAPERS - 1) };
export function freqOf(f) {
  if (f.hit === N_PAPERS) return 'always';
  if (f.hit >= FREQ_RULE.often) return 'often';
  return 'rare';
}
export const FREQ_SUMMARY = (() => {
  const buckets = { always: [], often: [], rare: [] };
  for (const f of FAM_MAP) buckets[freqOf(f)].push(f);
  return {
    always: buckets.always,
    often: buckets.often,
    rare: buckets.rare,
    alwaysScore: sum(buckets.always.map((f) => f.total)) / N_PAPERS,
    alwaysPct: Math.round((sum(buckets.always.map((f) => f.total)) / (N_PAPERS * 90)) * 100),
  };
})();

/* ============================ 结构稳定性 ============================ */
export const STRUCTURE = [
  {
    k: '必做满分',
    v: '90 分',
    same: PAPER_STATS.every((s) => s.mainTotal === 90),
  },
  {
    k: '必做小题数',
    v: '55 题',
    same: PAPER_STATS.every((s) => s.mainCount === 55),
  },
  {
    k: '选做满分',
    v: '10 分',
    same: PAPER_STATS.every((s) => s.bonusTotal === 10),
  },
  {
    k: '卷面封顶',
    v: '90 分',
    same: true,
    note: '选做计入总分，但卷面不超过 90',
  },
  {
    k: '考试时长',
    v: '100 分钟',
    same: true,
  },
  {
    k: '十大题顺序',
    v: '听选→听填→单选→完形→阅读→简答→音标→汉译英→文段',
    same: PAPER_STATS.every((s) => SEG_ORDER.every((g) => (s.seg[g] || 0) === (PAPER_STATS[0].seg[g] || 0))),
  },
];

// 板块分值逐年一致的部分（10 个板块全部逐年相同）
export const SEG_FIXED = SEG_ORDER.filter((k) => SEG_SCORE[k].fixed);
export const SEG_VARY = SEG_ORDER.filter((k) => !SEG_SCORE[k].fixed);

export const SEG_STABILITY = SEG_ORDER.map((k) => ({
  k, name: SEG_NAME[k], per: SEG_SCORE[k].per, r: SEG_SCORE[k].range, mean: SEG_SCORE[k].avg,
})).sort((a, b) => b.r - a.r);

export const CAT_STABILITY = CAT_ORDER.map((k) => ({
  k, name: k, per: CAT_SCORE[k].per, r: CAT_SCORE[k].range, mean: CAT_SCORE[k].avg,
})).sort((a, b) => b.r - a.r);

export const DIFF_STABILITY = DIFF_ORDER.map((k) => ({
  k, name: DIFF_NAME[k], per: DIFF_SCORE[k].per, r: DIFF_SCORE[k].range, mean: DIFF_SCORE[k].avg,
}));

/* ============================ 选择型 / 输出型：板块拆解 ============================ */
// 用于首页「90 分里有一半要写出来」那张卡
export const MODE_BREAKDOWN = ['select', 'write'].map((m) => ({
  mode: m,
  name: MODE_NAME[m],
  total: MODE_SCORE[m].avg,
  pct: MODE_SCORE[m].pct,
  segs: SEG_ORDER.filter((s) => {
    const qs = LEDGER.filter((q) => q.seg === s && !q.bonus);
    return qs.length && qs.every((q) => q.mode === m);
  }).map((s) => ({ k: s, name: SEG_NAME[s], score: SEG_SCORE[s].avg })),
}));

/* ============================ 交叉校验 ============================ */
// 逐年独立算的分值占比 vs 汇总占比，偏差超阈值即报错（与数学站同口径）
export const CROSS_CHECK = SEG_ORDER.map((k) => {
  const yearlyPct = PAPER_STATS.map((s) => Math.round(((s.seg[k] || 0) / s.mainTotal) * 100));
  const agg = SEG_SCORE[k].pct;
  const maxDev = Math.max(...yearlyPct.map((v) => Math.abs(v - agg)));
  return { k, name: SEG_NAME[k], yearlyPct, agg, maxDev, ok: maxDev <= 6 };
});

/* ============================ 样本诚实边界 ============================ */
// 这些不是「免责声明」，是硬事实，页面必须显示
export const SAMPLE_BOUNDS = [
  {
    k: '样本量',
    v: `${N_PAPERS} 套`,
    note: `数学站用 ${N_PAPERS} 套才敢说「年年考」，本站同样只用 ${N_PAPERS}/${N_PAPERS} 才算，不做跨年外推`,
  },
  {
    k: '有答案的卷子',
    v: `${PAPER_STATS.filter((s) => s.hasAnswer).length} / ${N_PAPERS} 套`,
    note: `${PAPER_STATS.filter((s) => !s.hasAnswer).map((s) => s.label).join('、')} 无答案，无法做干扰项反推`,
  },
  {
    k: '听力音频',
    v: '无',
    note: '听力 20 分只能分析「考什么形式」，无法验证实际难度',
  },
  {
    k: '作文评分标准',
    v: '卷面未给',
    note: '文段表达 10 分的内容分 / 语言分如何分配，不做拆解断言',
  },
];

/* ============================ 高频考点族（首页用） ============================ */
export const TOP_FAMS = FAM_MAP.filter((f) => !f.onlyBonus).slice(0, 6);


/* ============================ 命题稳定性：区分「年年考」与「某年才考」 ============================ */
// 这是回答「全区命题是否有差异」的实证口径：
// 同一个考点族，四年里出现的年数不同，说明命题组的选择在变。
export const PROP_STABILITY = FAM_MAP.filter((f) => !f.onlyBonus).map((f) => ({
  id: f.id,
  name: f.name,
  segs: f.seg,
  per: f.per,
  hit: f.hit,
  hitRate: +(f.hit / N_PAPERS).toFixed(2),
  avgPerYear: f.avgPerYear,
  level: f.hit === N_PAPERS ? 'stable' : f.hit >= Math.ceil(N_PAPERS / 2) ? 'variable' : 'sporadic',
}));

export const PROP_LEVEL_NAME = {
  stable: '年年考',
  variable: '多数年考',
  sporadic: '个别年考',
};

export const PROP_SUMMARY = {
  stable: PROP_STABILITY.filter((f) => f.level === 'stable'),
  variable: PROP_STABILITY.filter((f) => f.level === 'variable'),
  sporadic: PROP_STABILITY.filter((f) => f.level === 'sporadic'),
};

// 单选段的语法族逐年分布：命题差异最集中体现的地方
export const GRAMMAR_YEARLY = FAM_MAP
  .filter((f) => f.seg.includes('单选'))
  .map((f) => ({ id: f.id, name: f.name, per: f.per, hit: f.hit, avgPerYear: f.avgPerYear }))
  .sort((a, b) => b.hit - a.hit || b.avgPerYear - a.avgPerYear);

/* ============================ 教材对照 ============================ */
// 教材侧尚未核实，这里只产出「待核」状态与需要挂载的族清单。
// 页面据此显示占位，而不是假装有模块号。
export const BOOK_STATUS = {
  press: TEXTBOOK.press,
  book: TEXTBOOK.book,
  verified: TEXTBOOK.verified,
  ready: TEXTBOOK_READY,
  note: TEXTBOOK.verifiedNote,
  moduleCount: TEXTBOOK.modules.length,
  mappedFamCount: Object.keys(TEXTBOOK.famToModule).length,
};

// 需要挂教材的族（全部必做族），用于展示「待核进度 0/26」这类事实
export const BOOK_TARGET_FAMS = FAM_MAP.filter((f) => !f.onlyBonus);
export const BOOK_PROGRESS = {
  target: BOOK_TARGET_FAMS.length,
  done: BOOK_TARGET_FAMS.filter((f) => TEXTBOOK.famToModule[f.id]).length,
  pct: Math.round((BOOK_TARGET_FAMS.filter((f) => TEXTBOOK.famToModule[f.id]).length / BOOK_TARGET_FAMS.length) * 100),
};
