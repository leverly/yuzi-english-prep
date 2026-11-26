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
// ⚠ 双口径（2026-11-25 修正：此前只统计必做，漏掉选做）
//
//   必做口径 main*：必做 90 分，用于「卷面封顶 90」这条规则与「必做怎么复习」
//   全卷口径 all* ：必做 + 选做 = 100 分，用于一切「考情分析」
//
// 为什么必须双口径：选做计入总分、能补必做失分，**实际必须做**。
// 只统计必做会把「阅读简答 18 分」误算成 8 分，也会让只出现在选做的「词形填空」整族消失。
export const PAPER_STATS = PAPERS_META.map((meta) => {
  const qs = LEDGER.filter((q) => q.p === meta.id);
  const main = qs.filter((q) => !q.bonus);
  const bonus = qs.filter((q) => q.bonus);

  const acc = (list) => {
    const seg = {}, segN = {}, cat = {}, catN = {}, diff = {}, diffN = {}, mode = {}, modeN = {}, fam = {};
    for (const q of list) {
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
    return { seg, segN, cat, catN, diff, diffN, mode, modeN, fam };
  };

  const M = acc(main);
  const A = acc(qs);          // 全卷 = 必做 + 选做

  // 难度指数：easy 1 / mid 2 / hard 3，按分值加权后归一
  const W = { easy: 1, mid: 2, hard: 3 };
  const allTotal = sum(qs.map((q) => q.score));
  const diffIndex = +(sum(qs.map((q) => W[q.diff] * q.score)) / allTotal).toFixed(2);
  const mainDiffIndex = +(sum(main.map((q) => W[q.diff] * q.score)) / 90).toFixed(2);

  return {
    ...meta,
    qCount: qs.length,
    mainCount: main.length,
    bonusCount: bonus.length,
    mainTotal: sum(main.map((q) => q.score)),
    bonusTotal: sum(bonus.map((q) => q.score)),
    allTotal,
    // 必做口径
    seg: M.seg, segN: M.segN, cat: M.cat, catN: M.catN, diff: M.diff, diffN: M.diffN,
    mode: M.mode, modeN: M.modeN, fam: M.fam,
    mainDiffIndex,
    // 全卷口径（考情分析用这一套）
    allSeg: A.seg, allSegN: A.segN, allCat: A.cat, allCatN: A.catN,
    allDiff: A.diff, allDiffN: A.diffN, allMode: A.mode, allModeN: A.modeN, allFam: A.fam,
    diffIndex,
  };
});

export const YEARS = PAPER_STATS.map((s) => s.label);

/* ============================ 板块：跨年汇总 ============================ */
export const SEG_SCORE = {};
for (const k of SEG_ORDER) {
  const per = PAPER_STATS.map((s) => s.allSeg[k] || 0);
  const perN = PAPER_STATS.map((s) => s.allSegN[k] || 0);
  const total = sum(per);
  SEG_SCORE[k] = {
    id: k, name: SEG_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 100)) * 100),
    fixed: range(per) === 0,
  };
}

/* ============================ 能力层次：跨年汇总 ============================ */
export const CAT_SCORE = {};
for (const k of CAT_ORDER) {
  const per = PAPER_STATS.map((s) => s.allCat[k] || 0);
  const perN = PAPER_STATS.map((s) => s.allCatN[k] || 0);
  const total = sum(per);
  CAT_SCORE[k] = {
    id: k, name: k, per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 100)) * 100),
  };
}

/* ============================ 难度：跨年汇总 ============================ */
export const DIFF_SCORE = {};
for (const k of DIFF_ORDER) {
  const per = PAPER_STATS.map((s) => s.allDiff[k] || 0);
  const perN = PAPER_STATS.map((s) => s.allDiffN[k] || 0);
  const total = sum(per);
  DIFF_SCORE[k] = {
    id: k, name: DIFF_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 100)) * 100),
  };
}

/* ============================ 作答方式：选择型 vs 输出型 ============================ */
// 这是本站的核心切口：同样是 90 分，一半只涂卡，一半要写出文字。
export const MODE_SCORE = {};
for (const k of ['select', 'write']) {
  const per = PAPER_STATS.map((s) => s.allMode[k] || 0);
  const perN = PAPER_STATS.map((s) => s.allModeN[k] || 0);
  const total = sum(per);
  MODE_SCORE[k] = {
    id: k, name: MODE_NAME[k], per, perN, total,
    avg: +(total / N_PAPERS).toFixed(1),
    min: Math.min(...per), max: Math.max(...per),
    range: range(per),
    pct: Math.round((total / (N_PAPERS * 100)) * 100),
    fixed: range(per) === 0,
  };
}
// 输出型板块清单（由数据派生，不手写）
export const WRITE_SEGS = SEG_ORDER.filter((s) =>
  LEDGER.filter((q) => q.seg === s && !q.bonus).every((q) => q.mode === 'write'));

/* ============================ 考点族：跨年汇总 ============================ */
// 口径修正：含选做。此前用 !q.bonus 过滤，导致「词形填空」（只出现在选做）
// 整族消失、qs 为空、avgPerYear 为 0——那是分析漏洞不是事实。
export const FAM_MAP = FAM_DEFS.map((f) => {
  const qs = LEDGER.filter((q) => q.fam === f.id);          // 含选做
  const mainQs = qs.filter((q) => !q.bonus);
  const bonusQs = qs.filter((q) => q.bonus);
  const per = PAPER_STATS.map((s) => s.allFam[f.id] || 0);
  const perMain = PAPER_STATS.map((s) => s.fam[f.id] || 0);
  const hit = per.filter((v) => v > 0).length;
  const total = sum(per);
  return {
    ...f,
    qs, mainQs, bonusQs,
    per, perMain,
    hit,
    total,
    avgPerYear: +(total / N_PAPERS).toFixed(1),
    avgPerYearMain: +(sum(perMain) / N_PAPERS).toFixed(1),
    perYearHit: +(hit / N_PAPERS).toFixed(2),
    // 只在选做出现（如词形填空），保留但不当作空白
    onlyBonus: mainQs.length === 0 && bonusQs.length > 0,
    hasBonus: bonusQs.length > 0,
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
    alwaysPct: Math.round((sum(buckets.always.map((f) => f.total)) / (N_PAPERS * 100)) * 100),
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

/* ============================ 单词专项 ============================ */
// 音标填词 16 词：全卷唯一「范围明确、题型固定」的产出点
export const SPELL_ITEMS = LEDGER
  .filter((q) => q.seg === '音标填词' && !q.bonus)
  .map((q) => ({
    p: q.p,
    no: q.no,
    word: q.topic,
    ipa: q.ipa,
    sent: q.sent,
    feats: q.spell || [],
    len: q.topic.length,
  }));

// 按拼写特征聚合：一个词可能同时属于多类
export const SPELL_FEATURES = (() => {
  const map = new Map();
  for (const it of SPELL_ITEMS) {
    for (const f of it.feats) {
      if (!map.has(f)) map.set(f, []);
      map.get(f).push(it);
    }
  }
  return [...map.entries()]
    .map(([name, items]) => ({ name, items, count: items.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
})();

export const SPELL_STATS = {
  total: SPELL_ITEMS.length,
  perPaper: SPELL_ITEMS.length / N_PAPERS,
  avgLen: +(SPELL_ITEMS.reduce((a, i) => a + i.len, 0) / SPELL_ITEMS.length).toFixed(1),
  maxLen: Math.max(...SPELL_ITEMS.map((i) => i.len)),
  minLen: Math.min(...SPELL_ITEMS.map((i) => i.len)),
  featureCount: SPELL_FEATURES.length,
};

// 要「拼写」的板块（由 mode 派生，不手写）
export const SPELL_SEGMENTS = SEG_ORDER
  .filter((s) => {
    const qs = LEDGER.filter((q) => q.seg === s && !q.bonus);
    return qs.length && qs.every((q) => q.mode === 'write');
  })
  .map((s) => ({ k: s, name: SEG_NAME[s], score: SEG_SCORE[s].avg, count: PAPER_STATS[0].segN[s] || 0 }));

export const SPELL_TOTAL = +(MODE_SCORE.write.avg).toFixed(1);

/* ============================ 语法专项 ============================ */
// 语法族只在单选出现，但同一能力在输出题里被二次考核。
export const GRAMMAR_FAMS = FAM_MAP
  .filter((f) => f.seg.includes('单选') && !f.onlyBonus)
  .map((f) => ({
    id: f.id,
    name: f.name,
    per: f.per,
    hit: f.hit,
    total: f.total,
    avgPerYear: f.avgPerYear,
    level: f.hit === N_PAPERS ? 'stable' : f.hit >= Math.ceil(N_PAPERS / 2) ? 'variable' : 'sporadic',
  }))
  .sort((a, b) => b.hit - a.hit || b.avgPerYear - a.avgPerYear);

// 汉译英 12 句：语法真正被「写」出来的地方
export const SENT_ITEMS = LEDGER
  .filter((q) => q.seg === '汉译英' && !q.bonus)
  .map((q) => ({
    p: q.p,
    no: q.no,
    zh: q.zh,
    hint: q.hint,
    acts: q.acts || [],
    ans: q.ans,
  }));

// 语法动作频次：把 acts 拆开统计
export const SENT_ACTIONS = (() => {
  const map = new Map();
  for (const it of SENT_ITEMS) {
    for (const a of it.acts) {
      if (!map.has(a)) map.set(a, []);
      map.get(a).push(it);
    }
  }
  return [...map.entries()]
    .map(([name, items]) => ({ name, items, count: items.length }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh'));
})();

// 把动作归成「大类」，用于排优先级（动作名不同但训练方式相同的合并）
const ACT_GROUP = [
  { id: 'tense', label: '时态', test: (a) => /时态|现在进行/.test(a) },
  { id: 'agree', label: '主谓一致', test: (a) => /主谓一致/.test(a) },
  { id: 'colloc', label: '固定搭配', test: (a) => /^固定搭配/.test(a) },
  { id: 'pattern', label: '固定句式', test: (a) => /固定句式|It is time|It is \+ adj/.test(a) },
  { id: 'therebe', label: 'there be', test: (a) => /there be/.test(a) },
  { id: 'other', label: '其他（量词/副词）', test: () => true },
];
export const SENT_GROUPS = ACT_GROUP.map((g) => {
  const items = [];
  for (const it of SENT_ITEMS) {
    if (it.acts.some(g.test)) items.push(it);
  }
  return { id: g.id, label: g.label, items, count: items.length };
}).filter((g) => g.count > 0 && g.id !== 'other');

// 单选 + 汉译英 合并看：同一语法能力的两次考核
export const GRAMMAR_DOUBLE = GRAMMAR_FAMS.map((f) => {
  const test = {
    'f-tense': (a) => /时态|现在进行/.test(a),
    'f-agree': (a) => /主谓一致/.test(a),
    'f-therebe': (a) => /there be/.test(a),
    'f-prep': (a) => /be bad for/.test(a),
    'f-conj': () => false,
    'f-pron': () => false,
    'f-whq': () => false,
    'f-neg': () => false,
    'f-adjadv': () => false,
    'f-comm': () => false,
  }[f.id] || (() => false);
  const writeHits = SENT_ITEMS.filter((it) => it.acts.some(test));
  return {
    ...f,
    writeHits: writeHits.length,
    doubleTested: writeHits.length > 0,
  };
}).sort((a, b) => (b.writeHits - a.writeHits) || (b.hit - a.hit));

/* ============================ 写作专项 ============================ */
export const WRITE_ITEMS = LEDGER
  .filter((q) => q.seg === '文段表达' && !q.bonus)
  .map((q) => ({
    p: q.p,
    no: q.no,
    topic: q.topic,
    scene: q.scene,
    titleHint: q.titleHint,
    questions: q.questions,
    promptWords: q.promptWords,
    essay: q.essay,
    score: q.score,
    wordMin: 40,
  }));

export const WRITE_STATS = {
  total: WRITE_ITEMS.length,
  score: WRITE_ITEMS[0]?.score ?? 10,
  wordMin: 40,
  withEssay: WRITE_ITEMS.filter((w) => w.essay).length,
  // 四套的话题类型（人工归并，用于看「常考哪类场景」）
  scenes: WRITE_ITEMS.map((w) => w.scene),
};

// 提示问题条数：按问号数，不能按斜杠切——题干里有 he/she 这类斜杠，会多算。
export const WRITE_Q_COUNTS = WRITE_ITEMS.map((w) => ((w.questions || '').match(/\?/g) || []).length);
// 四套的条数区间，页面直接用它，不写死「2–3 个」
export const WRITE_Q_RANGE = {
  min: Math.min(...WRITE_Q_COUNTS),
  max: Math.max(...WRITE_Q_COUNTS),
};

/* ============================ 阅读专项 ============================ */
// 口径修正（2026-11-25）：含选做。选做的阅读题（尤其前三套的 10 分简答）
// 分值比必做简答还高，漏掉会把阅读总分算成 30 分（实际 40 分）。
export const READ_ITEMS = LEDGER.filter((q) => q.seg === '阅读选择' || q.seg === '阅读简答');
export const READ_MAIN_ITEMS = READ_ITEMS.filter((q) => !q.bonus);

export const READ_STATS = (() => {
  const sel = READ_ITEMS.filter((q) => q.seg === '阅读选择');
  const ans = READ_ITEMS.filter((q) => q.seg === '阅读简答');
  const selMain = sel.filter((q) => !q.bonus);
  const ansMain = ans.filter((q) => !q.bonus);
  const byFam = {};
  for (const q of sel) byFam[q.fam] = (byFam[q.fam] || 0) + 1;
  return {
    selCount: +(sel.length / N_PAPERS).toFixed(1),
    ansCount: +(ans.length / N_PAPERS).toFixed(1),
    selCountMain: +(selMain.length / N_PAPERS).toFixed(1),
    ansCountMain: +(ansMain.length / N_PAPERS).toFixed(1),
    selScore: SEG_SCORE['阅读选择'].avg,
    ansScore: SEG_SCORE['阅读简答'].avg,
    totalScore: +(SEG_SCORE['阅读选择'].avg + SEG_SCORE['阅读简答'].avg).toFixed(1),
    bonusScore: +(sel.filter((q) => q.bonus).reduce((a, q) => a + q.score, 0) / N_PAPERS
      + ans.filter((q) => q.bonus).reduce((a, q) => a + q.score, 0) / N_PAPERS).toFixed(1),
    selFams: Object.entries(byFam)
      .map(([k, v]) => ({ id: k, name: FAM_NAME[k], count: v, perPaper: +(v / N_PAPERS).toFixed(1), pct: Math.round((v / sel.length) * 100) }))
      .sort((a, b) => b.count - a.count),
  };
})();

// 阅读简答：检索 vs 概括开放——分值按各题实际 score 累加（选做是 5 分不是 2 分）
export const READ_ANS_TYPES = (() => {
  const ans = READ_ITEMS.filter((q) => q.seg === '阅读简答');
  const retrieve = ans.filter((q) => q.fam === 'f-read-answer');
  const open = ans.filter((q) => q.fam === 'f-read-open');
  const scoreOf = (list) => +(list.reduce((a, q) => a + q.score, 0) / N_PAPERS).toFixed(1);
  return {
    retrieve: retrieve.length, open: open.length,
    retrievePerPaper: +(retrieve.length / N_PAPERS).toFixed(1),
    openPerPaper: +(open.length / N_PAPERS).toFixed(1),
    retrieveScore: scoreOf(retrieve),
    openScore: scoreOf(open),
  };
})();


/* ============================ 阅读按篇章 ============================ */
// 每卷 11 道阅读选择：前 3 = A 篇，中 4 = B 篇，后 4 = C 篇（四套卷题号不同但结构一致）
export const READ_BY_PASSAGE = (() => {
  const sel = LEDGER.filter((q) => q.seg === '阅读选择' && !q.bonus);
  const G = { A: [], B: [], C: [] };
  for (const p of PAPER_STATS) {
    const qs = sel.filter((q) => q.p === p.id);
    qs.slice(0, 3).forEach((q) => G.A.push(q));
    qs.slice(3, 7).forEach((q) => G.B.push(q));
    qs.slice(7).forEach((q) => G.C.push(q));
  }
  return Object.entries(G).map(([k, qs]) => {
    const fam = {}, diff = { easy: 0, mid: 0, hard: 0 };
    for (const q of qs) {
      const name = FAM_NAME[q.fam].replace('阅读·', '');
      fam[name] = (fam[name] || 0) + 1;
      diff[q.diff] += 1;
    }
    const famList = Object.entries(fam)
      .map(([name, n]) => ({ name, n, pct: Math.round((n / qs.length) * 100) }))
      .sort((a, b) => b.n - a.n);
    return {
      key: k,
      title: `${k} 篇`,
      count: qs.length,
      perPaper: +(qs.length / N_PAPERS).toFixed(1),
      famList,
      diff,
      midPct: Math.round((diff.mid / qs.length) * 100),
      // 主题型 = 占比最高的那类
      mainFam: famList[0]?.name || '',
    };
  });
})();
