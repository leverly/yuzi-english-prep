// 北京市西城区初一(上)英语期末真题 · 逐题标注台账
//
// ⚠ 学年口径（2026-11-25 修正，此前版本标错一年）：
//   文件名里的年份 = **考试举行的年份（1 月）**，学年要往前推一年。
//   例：「2024北京西城初一（上）期末」是 2024.1 考，属 **2023-2024 学年**。
//   本台账按学年标注，逐份核对卷面首页日期。
//
// 口径（四套卷逐份核对首页与卷面，一致）：
//   必做 90 分 / 55 小题 + 选做 10 分（计入总分，卷面封顶 90）
//   考试 100 分钟
//
// 必做骨架（四套完全一致）：
//   听力一 听选    8 × 1.5 = 12
//   听力二 听填    4 × 2   =  8
//   三 单项填空    10 × 1  = 10
//   四 完形（一）选词 4 × 1 = 4
//     完形（二）选择 6 × 1 = 6
//   五 阅读选择    11 × 2  = 22   （A 篇 3 + B 篇 4 + C 篇 4）
//   六 阅读简答    4 × 2   =  8
//   七 音标填词    4 × 1   =  4
//   八 汉译英      3 × 2   =  6
//   九 文段表达    1 × 10  = 10
//   --------------------------------------------------
//   合计 90 分 / 55 小题
//
// 字段：
//   p     卷 id
//   no    该卷小题号（2024-25 卷单选从 1 重新编号，卷间题号不可互认）
//   seg   板块（见 SEG_ORDER）
//   fam   考点族（见 FAM_DEFS）
//   topic 具体考点，人读用
//   cat   能力层次：识记 / 理解 / 应用 / 综合
//   diff  难度：easy / mid / hard
//   mode  作答方式：select 选择（只涂卡）/ write 输出（要写出文字）
//   score 分值
//   bonus 是否选做
//
// 来源核实（四套均逐份打开首页核对）：
//   p2122 北京市西城区2021—2022学年度第一学期期末试卷（2022.1）—— 无答案
//   p2223 2023北京西城初一（上）期末（2023.1）—— 教师版
//   p2324 2024北京西城初一（上）期末（2024.1）—— 教师版
//   p2425 2025北京西城初一（上）期末（2025.1）—— 教师版，与 2024-2025 docx 同卷

export const PAPERS_META = [
  {
    id: 'p2122',
    year: '2021—2022',
    label: '2021-22',
    examDate: '2022.1',
    file: '北京市西城区2022学年七年级上学期期末考试英语试卷.pdf',
    hasAnswer: false,
    answerSource: '原卷无答案',
    qTotal: 57,
    bonusLayout: '第 56、57 题各 5 分',
    note: '选做 2 题，均为简答',
  },
  {
    id: 'p2223',
    year: '2022—2023',
    label: '2022-23',
    examDate: '2023.1',
    file: '2023北京西城初一（上）期末英语（教师版）.pdf',
    hasAnswer: true,
    answerSource: '教师版（卷末附参考答案）',
    qTotal: 57,
    bonusLayout: '第 56、57 题各 5 分',
    note: '选做 2 题，均为简答',
  },
  {
    id: 'p2324',
    year: '2023—2024',
    label: '2023-24',
    examDate: '2024.1',
    file: '2024北京西城初一（上）期末英语（教师版）.pdf',
    hasAnswer: true,
    answerSource: '教师版（卷末附参考答案）',
    qTotal: 57,
    bonusLayout: '第 56、57 题各 5 分',
    note: '选做 2 题，均为简答',
  },
  {
    id: 'p2425',
    year: '2024—2025',
    label: '2024-25',
    examDate: '2025.1',
    file: '2025北京西城初一（上）期末英语（教师版）.pdf',
    hasAnswer: true,
    answerSource: '教师版（卷末附参考答案）',
    qTotal: 62,
    bonusLayout: '第十大题词形填空 4 空各 1 分；第十一大题阅读选择 3 题各 2 分',
    note: '选做 7 小题，是唯一含「词形填空」的卷子；全卷 62 题',
  },
];

/* ============================ 板块 ============================ */
export const SEG_ORDER = [
  '听选', '听填', '单选', '完形选词', '完形选择',
  '阅读选择', '阅读简答', '音标填词', '汉译英', '文段表达',
];
export const SEG_NAME = {
  '听选': '听力·选择',
  '听填': '听力·填词',
  '单选': '单项填空',
  '完形选词': '完形·选词',
  '完形选择': '完形·选择',
  '阅读选择': '阅读·选择',
  '阅读简答': '阅读·简答',
  '音标填词': '音标填词',
  '汉译英': '汉译英',
  '文段表达': '文段表达',
};

/* ============================ 教材对照（外研版七上） ============================ */
// 教材确认：外研社（新标准）七年级上册。
//
// ⚠ 当前状态：**目录未核实，模块清单留空**。
//   不凭记忆填写模块号——填错会让「这个考点在第几模块」整张表失效，
//   而读者无法自行发现。留空并显式标注「待核」是可接受的；编造不可接受。
//
// 补全方式：拿到课本目录页后，只改下面这张表，不用动任何页面代码。
//   modules: 按课本顺序列模块，如 { no: 'Module 1', title: 'My classmates', grammar: 'be 动词' }
//   famToModule: 考点族 → 模块号数组（一个族可能跨多个模块）
export const TEXTBOOK = {
  press: '外研社（新标准）',
  book: '七年级上册',
  verified: false,                    // ← 目录核实后改 true
  verifiedNote: '目录未核实：模块清单与考点对应关系均为空，页面显示「待核」',
  modules: [],                        // ← 拿到目录后填
  famToModule: {},                    // ← 拿到目录后填，如 { 'f-pron': ['Module 1'] }
};

// 教材槽位是否可用（页面据此决定显示内容还是「待核」）
export const TEXTBOOK_READY = TEXTBOOK.verified && TEXTBOOK.modules.length > 0;

/* ============================ 考点族 ============================ */
// 归族口径：按「考法」不按「题干长相」，也不按题位。
export const FAM_DEFS = [
  // ---- 听力 ----
  { id: 'f-listen-detail', name: '听力·事实细节', seg: ['听选'], note: '谁/做什么/在哪里，原文直接给答案' },
  { id: 'f-listen-num', name: '听力·数字与时间', seg: ['听选'], note: '年龄、价格、时刻、时长' },
  { id: 'f-listen-main', name: '听力·主旨与意图', seg: ['听选'], note: '「Why does the speaker give this talk」这类整体判断' },
  { id: 'f-listen-dict', name: '听力·听写填空', seg: ['听填'], note: '听到关键词并正确拼写，形式错=零分' },

  // ---- 语法（单选）----
  { id: 'f-pron', name: '代词', seg: ['单选'], note: '人称代词、物主代词、指示代词', book: null },
  { id: 'f-prep', name: '介词', seg: ['单选'], note: 'in / on / at 表时间与地点，固定搭配 for' },
  { id: 'f-conj', name: '连词与逻辑', seg: ['单选'], note: 'but / so / or / because 判断前后句关系' },
  { id: 'f-whq', name: '疑问句', seg: ['单选'], note: '特殊疑问词选择 + 一般疑问句助动词' },
  { id: 'f-therebe', name: 'there be 句型', seg: ['单选'], note: '就近原则，be 动词单复数' },
  { id: 'f-agree', name: '主谓一致', seg: ['单选'], note: '第三人称单数，一般现在时谓语形式' },
  { id: 'f-tense', name: '时态与动词形式', seg: ['单选'], note: '现在进行 / 一般现在 / 一般将来，助动词后用原形' },
  { id: 'f-neg', name: '否定句', seg: ['单选'], note: "助动词否定形式，don't / doesn't / isn't 的选择" },
  { id: 'f-adjadv', name: '形容词副词辨析', seg: ['单选'], note: 'always / never / often 一类频率副词' },
  { id: 'f-comm', name: '情景交际', seg: ['单选'], note: '答语得体性，如 You are welcome' },

  // ---- 完形 ----
  { id: 'f-cloze-word', name: '完形·选词填空', seg: ['完形选词'], note: '给方框词，选出并填字母；考词义与词性匹配' },
  { id: 'f-cloze-ctx', name: '完形·语境选择', seg: ['完形选择'], note: '三选一，靠上下文逻辑与词义' },

  // ---- 阅读 ----
  { id: 'f-read-match', name: '阅读·信息匹配', seg: ['阅读选择'], note: '人物需求 ↔ 活动/海报，一对多匹配' },
  { id: 'f-read-detail', name: '阅读·细节定位', seg: ['阅读选择'], note: '原文有明确对应句，考找得到找不到' },
  { id: 'f-read-infer', name: '阅读·推断', seg: ['阅读选择'], note: '原文没直说，要合起来推' },
  { id: 'f-read-word', name: '阅读·词义猜测', seg: ['阅读选择'], note: '划线词/短语靠上下文定意' },
  { id: 'f-read-main', name: '阅读·主旨与标题', seg: ['阅读选择'], note: 'mainly about / best heading / 寓意' },
  { id: 'f-read-answer', name: '阅读·简答（检索）', seg: ['阅读简答'], note: '问什么答什么，要成句、时态人称对' },
  { id: 'f-read-open', name: '阅读·简答（概括开放）', seg: ['阅读简答'], note: '概括全文或表明观点并给理由' },

  // ---- 书面表达 ----
  { id: 'f-spell', name: '音标拼写', seg: ['音标填词'], note: '看音标写单词，认得出还要拼得对' },
  { id: 'f-sent', name: '汉译英单句', seg: ['汉译英'], note: '给提示词，写出完整正确句子' },
  { id: 'f-write', name: '文段表达', seg: ['文段表达'], note: '不少于 40 词，内容点齐 + 语言正确' },

  // ---- 选做 ----
  { id: 'f-word-form', name: '词形填空', seg: ['阅读选择'], note: '给括号内词的正确形式，只在选做出现' },
];

export const FAM_NAME = Object.fromEntries(FAM_DEFS.map((f) => [f.id, f.name]));

/* ============================ 能力层次 ============================ */
export const CAT_ORDER = ['识记', '理解', '应用', '综合'];
export const CAT_NAME = { '识记': '识记', '理解': '理解', '应用': '应用', '综合': '综合' };
export const CAT_NOTE = {
  '识记': '认得出、拼得对。补救＝默写与听写',
  '理解': '听得懂、读得懂。补救＝精读与证据句',
  '应用': '用对形式。补救＝句型改写操练',
  '综合': '概括、推断、成篇。补救＝仿写与提纲',
};

/* ============================ 难度 ============================ */
export const DIFF_ORDER = ['easy', 'mid', 'hard'];
export const DIFF_NAME = { easy: '基础', mid: '中档', hard: '较难' };

/* ============================ 作答方式 ============================ */
export const MODE_NAME = { select: '选择型', write: '输出型' };

/* ============================ 逐题台账 ============================ */
// 57 题卷题号区间：
//   1-8 听选   9-12 听填   13-22 单选   23-26 完形选词   27-32 完形选择
//   33-43 阅读选择   44-47 阅读简答   48-51 音标   52-54 汉译英   55 文段
//   56-57 选做
// 62 题卷（2024-25）：单选从 1 重新编号，另加第十一大题。

export const LEDGER = [
  // ==================== 2021-2022（无答案） ====================
  { p: 'p2122', no: 1, seg: '听选', fam: 'f-listen-num', topic: '年龄数字', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 2, seg: '听选', fam: 'f-listen-detail', topic: '班级信息', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 3, seg: '听选', fam: 'f-listen-detail', topic: '想要的食物', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 4, seg: '听选', fam: 'f-listen-num', topic: '午餐价格', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 5, seg: '听选', fam: 'f-listen-detail', topic: '人物爱好', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 6, seg: '听选', fam: 'f-listen-main', topic: '谈话主题', cat: '综合', diff: 'mid', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 7, seg: '听选', fam: 'f-listen-num', topic: '上学时刻', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2122', no: 8, seg: '听选', fam: 'f-listen-detail', topic: '周末活动', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },

  { p: 'p2122', no: 9, seg: '听填', fam: 'f-listen-dict', topic: 'or 并列结构填词', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2122', no: 10, seg: '听填', fam: 'f-listen-dict', topic: 'do word exercises', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2122', no: 11, seg: '听填', fam: 'f-listen-dict', topic: '复习动作（小标题）', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2122', no: 12, seg: '听填', fam: 'f-listen-dict', topic: 'after ... hours', cat: '识记', diff: 'mid', mode: 'write', score: 2 },

  { p: 'p2122', no: 13, seg: '单选', fam: 'f-pron', topic: '人称代词 he', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 14, seg: '单选', fam: 'f-pron', topic: '物主代词 her', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 15, seg: '单选', fam: 'f-prep', topic: '时刻前用 at', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 16, seg: '单选', fam: 'f-pron', topic: '指示代词 This', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 17, seg: '单选', fam: 'f-therebe', topic: 'there is a cup', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 18, seg: '单选', fam: 'f-agree', topic: '三单 goes', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 19, seg: '单选', fam: 'f-tense', topic: '现在进行 are sleeping', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 20, seg: '单选', fam: 'f-whq', topic: '疑问词 Where', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 21, seg: '单选', fam: 'f-tense', topic: '现在进行 is running', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 22, seg: '单选', fam: 'f-comm', topic: '答谢用语（判断语义得体）', cat: '理解', diff: 'easy', mode: 'select', score: 1 },

  { p: 'p2122', no: 23, seg: '完形选词', fam: 'f-cloze-word', topic: '名词 winter', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 24, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 snows（三单）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 25, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 stops（三单）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 26, seg: '完形选词', fam: 'f-cloze-word', topic: '形容词 big', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2122', no: 27, seg: '完形选择', fam: 'f-cloze-ctx', topic: '房间名词', cat: '理解', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 28, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动物名词', cat: '理解', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 29, seg: '完形选择', fam: 'f-cloze-ctx', topic: '位置名词', cat: '理解', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2122', no: 30, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 small', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 31, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 make a pet', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2122', no: 32, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 ready', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2122', no: 33, seg: '阅读选择', fam: 'f-read-detail', topic: '海报信息定位', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 长颈鹿海报', evQuote: 'My Favorite Animal: Giraffe', passage: 'A 篇' },
  { p: 'p2122', no: 34, seg: '阅读选择', fam: 'f-read-detail', topic: '动物习性定位', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 豹的海报', evQuote: 'It can climb trees, sleep on trees and even hunt', passage: 'A 篇' },
  { p: 'p2122', no: 35, seg: '阅读选择', fam: 'f-read-detail', topic: '原因细节', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'A 篇 壁虎海报', evQuote: 'It eats mosquitoes (蚊子). That’s why people in my hometown often welcome it', passage: 'A 篇' },
  { p: 'p2122', no: 36, seg: '阅读选择', fam: 'f-read-detail', topic: '谈话内容', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 第2段首句', evQuote: 'On the way home, Nancy and Mary talk about the math homework for that night', passage: 'B 篇' },
  { p: 'p2122', no: 37, seg: '阅读选择', fam: 'f-read-detail', topic: '打电话原因', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 电话段', evQuote: '“I’m bored. What are you up to?” Mary asks, “Do you need any help?”', passage: 'B 篇' },
  { p: 'p2122', no: 38, seg: '阅读选择', fam: 'f-read-infer', topic: '撒谎动机推断', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 撒谎段', evQuote: 'Nancy is struggling with the math homework but doesn’t want to say so', passage: 'B 篇' },
  { p: 'p2122', no: 39, seg: '阅读选择', fam: 'f-read-infer', topic: '人物性格推断', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 首段+结尾', evQuote: 'Mary, on the other hand, gets an A. … “Of course,” Mary says. “I’m bored. I need something to do.”', passage: 'B 篇' },
  { p: 'p2122', no: 40, seg: '阅读选择', fam: 'f-read-detail', topic: '打哈欠条件', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第2段', evQuote: 'Some people yawn when other people do', passage: 'C 篇' },
  { p: 'p2122', no: 41, seg: '阅读选择', fam: 'f-read-detail', topic: '第四段细节', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第4段', evQuote: 'It seems to start when children are four or five years old. That is when children start to feel what other people feel', passage: 'C 篇' },
  { p: 'p2122', no: 42, seg: '阅读选择', fam: 'f-read-infer', topic: '女性推断', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第6段', evQuote: 'It might make them better at skills (技能) with feelings. Being a parent is one of those skills', passage: 'C 篇' },
  { p: 'p2122', no: 43, seg: '阅读选择', fam: 'f-read-main', topic: '全文主旨', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 首句+全篇', evQuote: 'Are friends making you yawn? That’s a good thing. … contagious yawning', passage: 'C 篇' },

  { p: 'p2122', no: 44, seg: '阅读简答', fam: 'f-read-answer', topic: '人们对蚂蚁的感受', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 首段', evQuote: 'Ants are everywhere! We usually feel angry about them', refAns: 'We usually feel angry about them' , passage: '简答' },
  { p: 'p2122', no: 45, seg: '阅读简答', fam: 'f-read-answer', topic: '蚂蚁遇到障碍怎么做', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 Never give up 段', evQuote: 'when something is in front of ants, they do not sit down or become sad? They just keep (保持) going', refAns: 'They just keep going' , passage: '简答' },
  { p: 'p2122', no: 46, seg: '阅读简答', fam: 'f-read-answer', topic: '负荷太大时怎么做', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 Ask for help 段', evQuote: 'When a load (负荷) is too big, the ant signals (发信号) to the others for help', refAns: 'It signals to the others for help' , passage: '简答' },
  { p: 'p2122', no: 47, seg: '阅读简答', fam: 'f-read-open', topic: '蚂蚁教给我们什么（概括）', cat: '综合', diff: 'hard', mode: 'write', score: 2 , evLoc: '简答 全文（概括）', evQuote: 'Never give up / Ask for help / Think winter in summer — 三个小标题即三条启示', refAns: 'They teach us to never give up, to ask for help, and to plan ahead' , passage: '简答' },

  { p: 'p2122', no: 48, seg: '音标填词', fam: 'f-spell', topic: 'check', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[tʃek]', sent: 'His father often goes on the Internet to ___ the times of trains.', spell: ['字母组合 ch', 'ck 收尾'] },
  { p: 'p2122', no: 49, seg: '音标填词', fam: 'f-spell', topic: 'sweet', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[swiːt]', sent: 'Candy and cola are ___ food and drink.', spell: ['ee 组合'] },
  { p: 'p2122', no: 50, seg: '音标填词', fam: 'f-spell', topic: 'spring', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[sprɪŋ]', sent: 'My parents take me on a trip in ___ every year.', spell: ['三辅音丛 spr'] },
  { p: 'p2122', no: 51, seg: '音标填词', fam: 'f-spell', topic: 'panda', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[ˈpændə]', sent: 'The ___ eats about 30 kilos of bamboo a day.', spell: ['短元音 æ'] },

  { p: 'p2122', no: 52, seg: '汉译英', fam: 'f-sent', topic: 'have a break 句型', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '休息的时间到了。', hint: 'have a break', acts: ['固定搭配 have a break', 'It is time to do'], ans: "It's time to have a break." },
  { p: 'p2122', no: 53, seg: '汉译英', fam: 'f-sent', topic: 'too much meat 主谓', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '吃太多肉对儿童不好。', hint: 'too much meat', acts: ['主谓一致', 'too much + 不可数', 'be bad for'], ans: 'Eating too much meat is bad for children.' },
  { p: 'p2122', no: 54, seg: '汉译英', fam: 'f-sent', topic: '现在进行 wait for', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '她正在等公共汽车。', hint: 'wait for', acts: ['现在进行时', '固定搭配 wait for'], ans: 'She is waiting for a bus.' },

  { p: 'p2122', no: 55, seg: '文段表达', fam: 'f-write', topic: '介绍一位家庭成员（≥40 词）', cat: '综合', diff: 'hard', mode: 'write', score: 10 , scene: '介绍一位家庭成员', titleHint: 'My ______', questions: 'How old is he/she? / What is his/her job? / What does he/she like?', promptWords: 'teacher, manager, do sports, travel', essay: null },

  { p: 'p2122', no: 56, seg: '阅读简答', fam: 'f-read-answer', topic: 'Haley 在门口等的原因', cat: '应用', diff: 'mid', mode: 'write', score: 5, bonus: true , evLoc: '选做 第2段', evQuote: 'Sam sees Haley sitting by the mailbox. “Well, we need to work on our science project today,” Sam says', passage: '简答', refAns: 'Because they have to work on their science project today' },
  { p: 'p2122', no: 57, seg: '阅读简答', fam: 'f-read-open', topic: '最喜欢哪个人物及理由（开放）', cat: '综合', diff: 'hard', mode: 'write', score: 5, bonus: true , evLoc: '选做 全文（开放）', evQuote: '“I’ll go get her and work on the project.” “Good for you,” Kevin says.', passage: '简答', refAns: '开放题，参考答案未给统一答案' },

  // ==================== 2022-2023（教师版） ====================
  { p: 'p2223', no: 1, seg: '听选', fam: 'f-listen-detail', topic: '礼物送给谁', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 2, seg: '听选', fam: 'f-listen-detail', topic: '买什么礼物', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 3, seg: '听选', fam: 'f-listen-detail', topic: 'Betty 在做什么', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 4, seg: '听选', fam: 'f-listen-detail', topic: 'Betty 常用电脑做什么', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 5, seg: '听选', fam: 'f-listen-detail', topic: '寒假计划', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 6, seg: '听选', fam: 'f-listen-detail', topic: '如何获取更多信息', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 7, seg: '听选', fam: 'f-listen-detail', topic: '父亲周六做什么', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2223', no: 8, seg: '听选', fam: 'f-listen-detail', topic: '谁喜欢科学', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },

  { p: 'p2223', no: 9, seg: '听填', fam: 'f-listen-dict', topic: 'Beijing Zoo 历史年数', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2223', no: 10, seg: '听填', fam: 'f-listen-dict', topic: 'the ___ Hall', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2223', no: 11, seg: '听填', fam: 'f-listen-dict', topic: 'eating and ___ outside', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2223', no: 12, seg: '听填', fam: 'f-listen-dict', topic: 'comfortable and ___ life', cat: '识记', diff: 'mid', mode: 'write', score: 2 },

  { p: 'p2223', no: 13, seg: '单选', fam: 'f-pron', topic: '宾格代词 her', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2223', no: 14, seg: '单选', fam: 'f-therebe', topic: 'Is there any orange juice', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 15, seg: '单选', fam: 'f-agree', topic: 'Elephants live 复数主语用原形', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 16, seg: '单选', fam: 'f-prep', topic: '星期前用 on', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2223', no: 17, seg: '单选', fam: 'f-agree', topic: '三单 goes', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 18, seg: '单选', fam: 'f-conj', topic: '因果连词 so（判断前后句逻辑）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 19, seg: '单选', fam: 'f-whq', topic: '疑问词 What', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2223', no: 20, seg: '单选', fam: 'f-tense', topic: '现在进行 is singing', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 21, seg: '单选', fam: 'f-tense', topic: '现在进行 am drawing', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 22, seg: '单选', fam: 'f-neg', topic: "三单否定 doesn't", cat: '应用', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2223', no: 23, seg: '完形选词', fam: 'f-cloze-word', topic: '名词 friends', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 24, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 introduce yourself', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 25, seg: '完形选词', fam: 'f-cloze-word', topic: '名词 interests', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 26, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 like（三单）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2223', no: 27, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 afraid', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 28, seg: '完形选择', fam: 'f-cloze-ctx', topic: '频率副词 never', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 29, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 plan', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 30, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 drink', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 31, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 share', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2223', no: 32, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 love', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2223', no: 33, seg: '阅读选择', fam: 'f-read-detail', topic: '各国早餐表格定位', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Japan 栏', evQuote: 'Children enjoy having rice, fish and miso soup for breakfast', passage: 'A 篇' },
  { p: 'p2223', no: 34, seg: '阅读选择', fam: 'f-read-detail', topic: '哪国吃奶酪面包火腿', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Brazil 栏', evQuote: 'Children eat the foods like cheese, bread and ham (火腿) for breakfast', passage: 'A 篇' },
  { p: 'p2223', no: 35, seg: '阅读选择', fam: 'f-read-detail', topic: '哪道菜快捷易做', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Italy 栏', evQuote: 'Children eat Italian Frittata. Because it is quick and easy to make, it becomes the perfect meal for the family', passage: 'A 篇' },
  { p: 'p2223', no: 36, seg: '阅读选择', fam: 'f-read-detail', topic: '邀请函来自谁', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 首段', evQuote: '“An invitation (邀请) to my pool party. It’s at two on Saturday.” Sarah said', passage: 'B 篇' },
  { p: 'p2223', no: 37, seg: '阅读选择', fam: 'f-read-detail', topic: 'Ava 不想去派对的原因', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 中段', evQuote: 'But she didn’t want the whole school to find out she couldn’t swim', passage: 'B 篇' },
  { p: 'p2223', no: 38, seg: '阅读选择', fam: 'f-read-detail', topic: '母亲说了什么', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 母亲段', evQuote: 'Ava’s mother said, “Sarah is your friend. She won’t care that you can’t swim. You should go.”', passage: 'B 篇' },
  { p: 'p2223', no: 39, seg: '阅读选择', fam: 'f-read-main', topic: '故事寓意（诚实）', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 父亲段+结尾', evQuote: '“Just be honest (坦诚的) with Sarah,” her father said. … “Sarah, I have to tell you something.”', passage: 'B 篇' },
  { p: 'p2223', no: 40, seg: '阅读选择', fam: 'f-read-detail', topic: '作者幼年开始跑步的原因', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第2段', evQuote: 'Both of my parents ran and they encouraged (鼓励) me to join them from an early age', passage: 'C 篇' },
  { p: 'p2223', no: 41, seg: '阅读选择', fam: 'f-read-word', topic: 'at an all-time high 释义', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第6段', evQuote: 'Now my love for running is at an all-time high. … my love for the sport has grown stronger', passage: 'C 篇' },
  { p: 'p2223', no: 42, seg: '阅读选择', fam: 'f-read-infer', topic: '作者情况推断', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 首段', evQuote: 'running has always been quite an important part of our lives', passage: 'C 篇' },
  { p: 'p2223', no: 43, seg: '阅读选择', fam: 'f-read-main', topic: '全文主旨', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 首段', evQuote: 'But my feelings about running seem to change more often than I would like them to', passage: 'C 篇' },

  { p: 'p2223', no: 44, seg: '阅读简答', fam: 'f-read-answer', topic: '科学家的特殊帮手', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第1段', evQuote: 'They did it using videos taken by some unusual helpers: tiger sharks', refAns: 'Tiger sharks' , passage: '简答' },
  { p: 'p2223', no: 45, seg: '阅读简答', fam: 'f-read-answer', topic: '为何难找到海草', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第3段', evQuote: 'Sea grasses can be hard to see because the water is too deep and not clear enough', refAns: 'Because the water is too deep and not clear enough' , passage: '简答' },
  { p: 'p2223', no: 46, seg: '阅读简答', fam: 'f-read-answer', topic: '科学家如何找到相机', cat: '应用', diff: 'mid', mode: 'write', score: 2 , evLoc: '简答 第4段', evQuote: 'Tracking signals (追踪信号) helped the scientists find the floating cameras', refAns: 'By tracking signals' , passage: '简答' },
  { p: 'p2223', no: 47, seg: '阅读简答', fam: 'f-read-open', topic: '末段作者想告诉我们什么（概括）', cat: '综合', diff: 'hard', mode: 'write', score: 2 , evLoc: '简答 末段', evQuote: 'The research also shows how useful large underwater animals can be in helping to learn more about life under the sea', refAns: 'Large underwater animals are useful in helping to learn more about life under the sea' , passage: '简答' },

  { p: 'p2223', no: 48, seg: '音标填词', fam: 'f-spell', topic: 'cut', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[kʌt]', sent: "Sam, let's ___ the big birthday cake together.", spell: ['短元音 ʌ'] },
  { p: 'p2223', no: 49, seg: '音标填词', fam: 'f-spell', topic: 'film', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[fɪlm]', sent: 'Would you like to see a ___ with me this Sunday?', spell: ['短元音 ɪ'] },
  { p: 'p2223', no: 50, seg: '音标填词', fam: 'f-spell', topic: 'funny', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[ˈfʌni]', sent: 'When you are sad, try to read some ___ stories.', spell: ['双写 nn', 'y 收尾'] },
  { p: 'p2223', no: 51, seg: '音标填词', fam: 'f-spell', topic: 'driver', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[ˈdraɪvə]', sent: 'My uncle is a ___ and he works for a bus company.', spell: ['辅音丛 dr', 'er 弱读'] },

  { p: 'p2223', no: 52, seg: '汉译英', fam: 'f-sent', topic: '现在进行 clean 句型', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '学生们正在打扫教室。', hint: 'clean', acts: ['现在进行时'], ans: 'The students are cleaning the classroom.' },
  { p: 'p2223', no: 53, seg: '汉译英', fam: 'f-sent', topic: 'often + 三单 watch', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: 'Jack 经常和他爸爸一起看足球比赛。', hint: 'watch', acts: ['主谓一致（三单）', '频率副词 often'], ans: 'Jack often watches football matches with his dad.' },
  { p: 'p2223', no: 54, seg: '汉译英', fam: 'f-sent', topic: 'there be 句型', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '图书馆里有许多新书。', hint: 'there be', acts: ['there be 句型'], ans: 'There are many new books in the library.' },

  { p: 'p2223', no: 55, seg: '文段表达', fam: 'f-write', topic: '家庭欢乐时刻发言稿（≥40 词）', cat: '综合', diff: 'hard', mode: 'write', score: 10 , scene: '家庭欢乐时刻发言稿', titleHint: 'My Family Fun Time', questions: 'When is your family fun time? / What do you and your family usually do? / What do you think of your family fun time?', promptWords: 'weekend, talk, exercise, movie, warm, love', essay: null },

  { p: 'p2223', no: 56, seg: '阅读简答', fam: 'f-read-answer', topic: 'Grace 的问题是什么', cat: '应用', diff: 'mid', mode: 'write', score: 5, bonus: true , evLoc: '选做 第1段', evQuote: 'Grace has always dreamed of becoming a firefighter, helping others and being a hero. When she told her friends about her dream, they laughed because a girl can’t be a’fireman’', passage: '简答', refAns: 'Her friends laughed at her dream of becoming a firefighter' },
  { p: 'p2223', no: 57, seg: '阅读简答', fam: 'f-read-open', topic: '问题如何解决（概括）', cat: '综合', diff: 'hard', mode: 'write', score: 5, bonus: true , evLoc: '选做 末段', evQuote: 'her mom got her computer, ran a quick search … Grace’s mom said, “Why not send an email to the firefighter?” … Constance was holding the cake', passage: '简答', refAns: 'Her mom searched online, Grace emailed the firefighter, and Constance came to her birthday' },

  // ==================== 2023-2024（教师版） ====================
  { p: 'p2324', no: 1, seg: '听选', fam: 'f-listen-num', topic: '哥哥年龄', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 2, seg: '听选', fam: 'f-listen-detail', topic: '父亲职业', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 3, seg: '听选', fam: 'f-listen-detail', topic: '最喜欢的动物', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 4, seg: '听选', fam: 'f-listen-detail', topic: '放学后的计划', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 5, seg: '听选', fam: 'f-listen-num', topic: '科学课在周几', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 6, seg: '听选', fam: 'f-listen-detail', topic: '喜欢历史的原因', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 7, seg: '听选', fam: 'f-listen-detail', topic: '独白信息判断', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },
  { p: 'p2324', no: 8, seg: '听选', fam: 'f-listen-main', topic: '讲话目的', cat: '综合', diff: 'mid', mode: 'select', score: 1.5 },

  { p: 'p2324', no: 9, seg: '听填', fam: 'f-listen-dict', topic: 'It helps us ___ , remember', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2324', no: 10, seg: '听填', fam: 'f-listen-dict', topic: "It's always ___ to get a letter", cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2324', no: 11, seg: '听填', fam: 'f-listen-dict', topic: 'Typing saves ___', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2324', no: 12, seg: '听填', fam: 'f-listen-dict', topic: 'just need to ___ a few keys', cat: '识记', diff: 'mid', mode: 'write', score: 2 },

  { p: 'p2324', no: 13, seg: '单选', fam: 'f-pron', topic: '代词 She', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2324', no: 14, seg: '单选', fam: 'f-prep', topic: '时刻前用 at', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2324', no: 15, seg: '单选', fam: 'f-prep', topic: 'be bad for 固定搭配', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2324', no: 16, seg: '单选', fam: 'f-whq', topic: 'How many 修饰可数名词', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 17, seg: '单选', fam: 'f-tense', topic: '助动词后用原形 have', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 18, seg: '单选', fam: 'f-therebe', topic: 'there are + 复数', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2324', no: 19, seg: '单选', fam: 'f-agree', topic: 'People 后谓语用原形 buy', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 20, seg: '单选', fam: 'f-agree', topic: 'it 后三单 eats', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 21, seg: '单选', fam: 'f-tense', topic: '现在进行 am looking', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 22, seg: '单选', fam: 'f-whq', topic: '疑问词 Where', cat: '应用', diff: 'easy', mode: 'select', score: 1 },

  { p: 'p2324', no: 23, seg: '完形选词', fam: 'f-cloze-word', topic: '名词 playground', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 24, seg: '完形选词', fam: 'f-cloze-word', topic: '副词 fast', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 25, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 share', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 26, seg: '完形选词', fam: 'f-cloze-word', topic: '副词 finally', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2324', no: 27, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 ready', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 28, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 questions', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 29, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 gets up', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 30, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 schoolbag', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 31, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 heavy feet（固定搭配）', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2324', no: 32, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 smiles', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2324', no: 33, seg: '阅读选择', fam: 'f-read-match', topic: '匹配：爱动植物 → 自然营', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Winter Nature Camp', evQuote: 'Do you love animals and plants? This is just for you', passage: 'A 篇' },
  { p: 'p2324', no: 34, seg: '阅读选择', fam: 'f-read-match', topic: '匹配：想玩单板 → 雪上运动营', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Snow Sports Camp', evQuote: 'You can also try snowboarding. It’s fast and exciting. … you’ll also meet new friends', passage: 'A 篇' },
  { p: 'p2324', no: 35, seg: '阅读选择', fam: 'f-read-match', topic: '匹配：爱动手 → 雪艺术营', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Snow Art Camp', evQuote: 'Do you enjoy making things? … build sculptures out of snow and ice', passage: 'A 篇' },
  { p: 'p2324', no: 36, seg: '阅读选择', fam: 'f-read-detail', topic: 'Emma 家夏天的传统', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 第1段', evQuote: 'Their family has a special tradition—spending summers at Grandma’s', passage: 'B 篇' },
  { p: 'p2324', no: 37, seg: '阅读选择', fam: 'f-read-detail', topic: '阁楼里发现了什么', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 第2段', evQuote: 'There, they find a box. Inside are some old letters', passage: 'B 篇' },
  { p: 'p2324', no: 38, seg: '阅读选择', fam: 'f-read-detail', topic: '听完故事后的感受', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 第5段', evQuote: 'Emma listens closely and feels warm inside', passage: 'B 篇' },
  { p: 'p2324', no: 39, seg: '阅读选择', fam: 'f-read-main', topic: '作者主要想告诉我们', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 第2+4段', evQuote: 'These letters are like windows, showing how her family has changed over the years', passage: 'B 篇' },
  { p: 'p2324', no: 40, seg: '阅读选择', fam: 'f-read-detail', topic: '如何养成健康习惯', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第1段', evQuote: 'the best way is by making small changes', passage: 'C 篇' },
  { p: 'p2324', no: 41, seg: '阅读选择', fam: 'f-read-infer', topic: '从全文可以得知', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第3段', evQuote: 'The good news is that it’s OK to take shorter “exercise breaks” during the day', passage: 'C 篇' },
  { p: 'p2324', no: 42, seg: '阅读选择', fam: 'f-read-word', topic: 'occasionally 释义', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第5段 上下文', evQuote: 'there’s nothing wrong with a treat occasionally. A candy bar somehow tastes more special if we treat ourselves from time to time, not every day', passage: 'C 篇' },
  { p: 'p2324', no: 43, seg: '阅读选择', fam: 'f-read-main', topic: '作者写作目的', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 首段末句', evQuote: 'Here’s the information you need to make healthy habits easy', passage: 'C 篇' },

  { p: 'p2324', no: 44, seg: '阅读简答', fam: 'f-read-answer', topic: '12 颗葡萄象征什么', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第2段', evQuote: 'These 12 grapes stand for the 12 months of the year', refAns: 'These 12 grapes stand for the 12 months of the year' , passage: '简答' },
  { p: 'p2324', no: 45, seg: '阅读简答', fam: 'f-read-answer', topic: '日本为何送钱', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第3段', evQuote: 'to bring good luck and welcome the New Year', refAns: 'To bring good luck and welcome the New Year' , passage: '简答' },
  { p: 'p2324', no: 46, seg: '阅读简答', fam: 'f-read-answer', topic: '加拿大怎么庆祝', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第4段', evQuote: 'In Canada, some people celebrate the new year by jumping into the sea', refAns: 'By jumping into the sea' , passage: '简答' },
  { p: 'p2324', no: 47, seg: '阅读简答', fam: 'f-read-open', topic: '全文主要讲什么（概括）', cat: '综合', diff: 'mid', mode: 'write', score: 2 , evLoc: '简答 首段', evQuote: 'There are many ways to celebrate the coming of a new year. … different New Year’s traditions', refAns: 'Some ways and traditions to celebrate the coming new year' , passage: '简答' },

  { p: 'p2324', no: 48, seg: '音标填词', fam: 'f-spell', topic: 'map', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[mæp]', sent: 'There is a ___ on the wall in my room.', spell: ['短元音 æ'] },
  { p: 'p2324', no: 49, seg: '音标填词', fam: 'f-spell', topic: 'party', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[ˈpɑːti]', sent: 'I usually hold a ___ at home on my birthday.', spell: ['ar 组合'] },
  { p: 'p2324', no: 50, seg: '音标填词', fam: 'f-spell', topic: 'fish', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[fɪʃ]', sent: "Meat and ___ are healthy food but too much meat isn't healthy.", spell: ['sh 组合'] },
  { p: 'p2324', no: 51, seg: '音标填词', fam: 'f-spell', topic: 'big', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[bɪg]', sent: 'In the evening before Spring Festival we usually have a ___ family dinner.', spell: ['短元音 ɪ'] },

  { p: 'p2324', no: 52, seg: '汉译英', fam: 'f-sent', topic: 'be good at 句型', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '大明擅长踢足球。', hint: 'be good at', acts: ['固定搭配 be good at + 动名词'], ans: 'Daming is good at playing football.' },
  { p: 'p2324', no: 53, seg: '汉译英', fam: 'f-sent', topic: "It's time to do 句型", cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '到了大扫除的时间了。', hint: 'do some cleaning', acts: ['固定句式 It is time to do'], ans: "It's time to do some cleaning." },
  { p: 'p2324', no: 54, seg: '汉译英', fam: 'f-sent', topic: 'get ready for 现在进行', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '我们正在为春节做准备。', hint: 'get ready for', acts: ['现在进行时', '固定搭配 get ready for'], ans: 'We are getting ready for the Spring Festival.' },

  { p: 'p2324', no: 55, seg: '文段表达', fam: 'f-write', topic: '感谢某人并说明做法与理由（≥40 词）', cat: '综合', diff: 'hard', mode: 'write', score: 10 , scene: '感谢某人并说明做法与理由', titleHint: '', questions: 'Who do you want to thank? / What do you want to do for him/her? / Why do you want to do so?', promptWords: 'present, book, like reading, show', essay: 'I want to buy some fish and books for my mother. I am getting fatter and fatter, while my mom is getting thinner and thinner. She should eat more fish and other delicious food. And she likes reading books. So I want to give her favourite books to thank her. I think it is good for her body and spirits.' },

  { p: 'p2324', no: 56, seg: '阅读简答', fam: 'f-read-answer', topic: '列出四项有意义的活动', cat: '应用', diff: 'mid', mode: 'write', score: 5, bonus: true , evLoc: '选做 末段', evQuote: 'spend your time on some enjoyable and meaningful activities, such as building yourself a special place, making reading or exercise plans … making up a game, learning something new', passage: '简答', refAns: 'Building a special place / making reading or exercise plans / making up a game / learning something new' },
  { p: 'p2324', no: 57, seg: '阅读简答', fam: 'f-read-open', topic: '无聊是好是坏 + 至少两条理由', cat: '综合', diff: 'hard', mode: 'write', score: 5, bonus: true , evLoc: '选做 全文（开放）', evQuote: 'Can boredom be good for you? … Knowing when you’re bored and learning to “unbore” yourself will also help you learn to solve problems', passage: '简答', refAns: '开放题；参考答案未给统一答案，需表明观点 + 至少两条理由' },

  // ==================== 2024-2025（教师版，62 题卷，单选从 1 重新编号） ====================
  { p: 'p2425', no: 1, seg: '听选', fam: 'f-listen-detail', topic: '同行人物', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 2, seg: '听选', fam: 'f-listen-num', topic: '停留时长', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 3, seg: '听选', fam: 'f-listen-detail', topic: '想要的宠物', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 4, seg: '听选', fam: 'f-listen-detail', topic: '照看宠物的人', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 5, seg: '听选', fam: 'f-listen-detail', topic: '参加的社团', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 6, seg: '听选', fam: 'f-listen-detail', topic: '女孩将要做的事', cat: '理解', diff: 'easy', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 7, seg: '听选', fam: 'f-listen-detail', topic: '独白信息判断', cat: '理解', diff: 'mid', mode: 'select', score: 1.5 },
  { p: 'p2425', no: 8, seg: '听选', fam: 'f-listen-main', topic: '讲话目的', cat: '综合', diff: 'mid', mode: 'select', score: 1.5 },

  { p: 'p2425', no: 9, seg: '听填', fam: 'f-listen-dict', topic: 'turn a big ___ into', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2425', no: 10, seg: '听填', fam: 'f-listen-dict', topic: 'ask your ___ for help', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2425', no: 11, seg: '听填', fam: 'f-listen-dict', topic: '___ your time', cat: '识记', diff: 'mid', mode: 'write', score: 2 },
  { p: 'p2425', no: 12, seg: '听填', fam: 'f-listen-dict', topic: 'about ___ minutes', cat: '识记', diff: 'mid', mode: 'write', score: 2 },

  { p: 'p2425', no: 1, seg: '单选', fam: 'f-pron', topic: '代词 she（官方标注：代词辨析）', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2425', no: 2, seg: '单选', fam: 'f-prep', topic: '介词 in + 季节', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2425', no: 3, seg: '单选', fam: 'f-conj', topic: '并列连词 but（判断前后句逻辑）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 4, seg: '单选', fam: 'f-adjadv', topic: '频率副词 never（判断语义）', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 5, seg: '单选', fam: 'f-whq', topic: '一般疑问句助动词 Does', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2425', no: 6, seg: '单选', fam: 'f-therebe', topic: 'there are + 复数', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2425', no: 7, seg: '单选', fam: 'f-whq', topic: '特殊疑问词 Where', cat: '应用', diff: 'easy', mode: 'select', score: 1 },
  { p: 'p2425', no: 8, seg: '单选', fam: 'f-agree', topic: '三单 listens', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 9, seg: '单选', fam: 'f-tense', topic: '现在进行 am looking', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 10, seg: '单选', fam: 'f-tense', topic: '一般将来 is going to', cat: '应用', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2425', no: 11, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 come', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 12, seg: '完形选词', fam: 'f-cloze-word', topic: '形容词 big', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 13, seg: '完形选词', fam: 'f-cloze-word', topic: '动词 sit on eggs', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 14, seg: '完形选词', fam: 'f-cloze-word', topic: '名词 eggs', cat: '理解', diff: 'mid', mode: 'select', score: 1 },

  { p: 'p2425', no: 15, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 bed', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 16, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 hit an idea（固定搭配）', cat: '应用', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 17, seg: '完形选择', fam: 'f-cloze-ctx', topic: '副词 excitedly', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 18, seg: '完形选择', fam: 'f-cloze-ctx', topic: '形容词 worried', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 19, seg: '完形选择', fam: 'f-cloze-ctx', topic: '名词 storm', cat: '理解', diff: 'mid', mode: 'select', score: 1 },
  { p: 'p2425', no: 20, seg: '完形选择', fam: 'f-cloze-ctx', topic: '动词 weathered（难词搭配）', cat: '应用', diff: 'hard', mode: 'select', score: 1 },

  { p: 'p2425', no: 21, seg: '阅读选择', fam: 'f-read-match', topic: '需求匹配：喜欢唱歌 → 音乐', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Music Journey', evQuote: 'Our music teacher will introduce different kinds of Chinese music to you. She will also teach you how to sing Beijing Opera', passage: 'A 篇' },
  { p: 'p2425', no: 22, seg: '阅读选择', fam: 'f-read-match', topic: '需求匹配：去英国 → 文化', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Culture Corner', evQuote: 'We will learn about life, food and festivals in countries like England, America and Australia', passage: 'A 篇' },
  { p: 'p2425', no: 23, seg: '阅读选择', fam: 'f-read-match', topic: '需求匹配：想户外运动', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'A 篇 Sports Fun', evQuote: 'We will hold many exciting events, such as football matches and running races', passage: 'A 篇' },
  { p: 'p2425', no: 24, seg: '阅读选择', fam: 'f-read-detail', topic: 'Molly 挑什么苹果', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 首段', evQuote: 'She was careful to pick the big and sweet apples only', passage: 'B 篇' },
  { p: 'p2425', no: 25, seg: '阅读选择', fam: 'f-read-detail', topic: 'Molly 的情绪', cat: '理解', diff: 'easy', mode: 'select', score: 2 , evLoc: 'B 篇 中段', evQuote: '“No! ” Molly cried in anger, trying to pull out Sam’s apples', passage: 'B 篇' },
  { p: 'p2425', no: 26, seg: '阅读选择', fam: 'f-read-detail', topic: '拒绝品尝的原因', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 后段', evQuote: 'Molly refused to try the sauce at first. Dad held a spoon … and she tasted just a little', passage: 'B 篇' },
  { p: 'p2425', no: 27, seg: '阅读选择', fam: 'f-read-main', topic: '故事寓意', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'B 篇 父亲的话', evQuote: '“Sometimes mistakes can turn out to be good surprises.”', passage: 'B 篇' },
  { p: 'p2425', no: 28, seg: '阅读选择', fam: 'f-read-detail', topic: '关于秘密的事实', cat: '理解', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第2段', evQuote: 'When we keep a secret, we must always watch what we say, and it can be very tiring!', passage: 'C 篇' },
  { p: 'p2425', no: 29, seg: '阅读选择', fam: 'f-read-word', topic: 'strengthen the bond with 释义', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 第4段 上下文', evQuote: 'Keeping a shared secret with someone can strengthen the bond with that person. It can make us feel more connected to them', passage: 'C 篇' },
  { p: 'p2425', no: 30, seg: '阅读选择', fam: 'f-read-main', topic: '末段最佳标题', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 末段', evQuote: 'There is no rule on when to keep or share a secret. It is your choice', passage: 'C 篇' },
  { p: 'p2425', no: 31, seg: '阅读选择', fam: 'f-read-infer', topic: '作者观点推断', cat: '综合', diff: 'mid', mode: 'select', score: 2 , evLoc: 'C 篇 末段', evQuote: 'if a secret does not make you or anybody else feel bad, it is probably OK to keep it', passage: 'C 篇' },

  { p: 'p2425', no: 32, seg: '阅读简答', fam: 'f-read-answer', topic: '何时加入观鸟社', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第1段', evQuote: 'At the beginning of Grade 7, I joined a birdwatching club at my school', refAns: 'At the beginning of Grade 7' , passage: '简答' },
  { p: 'p2425', no: 33, seg: '阅读简答', fam: 'f-read-answer', topic: '常在哪里观鸟', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第2段', evQuote: 'In my free time, I often watched birds in a park near my home', refAns: 'In a park near his home' , passage: '简答' },
  { p: 'p2425', no: 34, seg: '阅读简答', fam: 'f-read-answer', topic: '去年夏天的旅行', cat: '应用', diff: 'easy', mode: 'write', score: 2 , evLoc: '简答 第3段', evQuote: 'Last summer, I went on a ten-day birdwatching trip to Yunnan with the birdwatching club', refAns: 'A ten-day birdwatching trip to Yunnan' , passage: '简答' },
  { p: 'p2425', no: 35, seg: '阅读简答', fam: 'f-read-open', topic: '是否想尝试观鸟及理由（开放）', cat: '综合', diff: 'hard', mode: 'write', score: 2 , evLoc: '简答 末段（开放）', evQuote: 'It’s a simple hobby for everyone because you don’t need much to get started. So come and join me!', refAns: 'Yes. Because it is interesting' , passage: '简答' },

  { p: 'p2425', no: 36, seg: '音标填词', fam: 'f-spell', topic: 'rest', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[rest]', sent: "It's going to get dark. The workers will take a ___.", spell: ['短元音 e'] },
  { p: 'p2425', no: 37, seg: '音标填词', fam: 'f-spell', topic: 'dish', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[dɪʃ]', sent: "The Lion's Head is a special ___ at Spring Festival.", spell: ['sh 组合', '短元音 ɪ'] },
  { p: 'p2425', no: 38, seg: '音标填词', fam: 'f-spell', topic: 'feed', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[fiːd]', sent: 'The girl went to the park to ___ the pigeons.', spell: ['ee 组合'] },
  { p: 'p2425', no: 39, seg: '音标填词', fam: 'f-spell', topic: 'smell', cat: '识记', diff: 'easy', mode: 'write', score: 1 , ipa: '[smel]', sent: 'Rescue dogs have a strong sense of ___.', spell: ['辅音丛 sm', '双写 ll'] },

  { p: 'p2425', no: 40, seg: '汉译英', fam: 'f-sent', topic: 'be good for 句型', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '茶有益于我们的健康。', hint: 'good for, health', acts: ['固定搭配 be good for'], ans: 'Tea is good for our health.' },
  { p: 'p2425', no: 41, seg: '汉译英', fam: 'f-sent', topic: 'it is + adj + to do', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '在学习中，思考很重要。', hint: 'important, in learning', acts: ['固定句式 It is + adj + to do'], ans: 'It is important to think in learning.' },
  { p: 'p2425', no: 42, seg: '汉译英', fam: 'f-sent', topic: 'try their best 主谓', cat: '应用', diff: 'mid', mode: 'write', score: 2 , zh: '老师们总是尽力帮助我们。', hint: 'try their best', acts: ['主谓一致（复数 + 原形）', '频率副词 always'], ans: 'Teachers always try their best to help us.' },

  { p: 'p2425', no: 43, seg: '文段表达', fam: 'f-write', topic: '介绍喜欢的传统节日（≥40 词）', cat: '综合', diff: 'hard', mode: 'write', score: 10 , scene: '介绍喜欢的传统节日', titleHint: '', questions: 'What is your favorite traditional Chinese festival? / How do you usually celebrate it?', promptWords: 'take place, enjoy, have a big meal, family reunion', essay: 'Spring Festival is my favorite festival. It usually happens in January or February. My family celebrate it by doing many interesting and meaningful activities. We often clean the house and buy a lot of food before the festival. On Spring Festival Eve, we get together and have a big reunion dinner. Jiaozi is a must, and we also prepare many other delicious dishes. Everyone wears new clothes and kids always get lucky money from the elders as a symbol of good wishes for good luck, health and prosperity in the new year. I like Spring Festival, because it makes me feel warm and loved.' },

  { p: 'p2425', no: 44, seg: '阅读选择', fam: 'f-word-form', topic: '(sun) → sunny', cat: '应用', diff: 'mid', mode: 'write', score: 1, bonus: true , evLoc: '选做 第1段 (sun)', evQuote: 'It’s ___ (sun) now, but please take a raincoat', passage: '简答', refAns: 'sunny' },
  { p: 'p2425', no: 45, seg: '阅读选择', fam: 'f-word-form', topic: '(rain) → will rain', cat: '应用', diff: 'mid', mode: 'write', score: 1, bonus: true , evLoc: '选做 第1段 (rain)', evQuote: 'I’m sure it ___ (rain) later', passage: '简答', refAns: 'will rain' },
  { p: 'p2425', no: 46, seg: '阅读选择', fam: 'f-word-form', topic: '(come) → comes', cat: '应用', diff: 'mid', mode: 'write', score: 1, bonus: true , evLoc: '选做 第2段 (come)', evQuote: 'Water ___ (come) into the air from the leaves, and becomes clouds', passage: '简答', refAns: 'comes' },
  { p: 'p2425', no: 47, seg: '阅读选择', fam: 'f-word-form', topic: '(tree) → trees', cat: '应用', diff: 'mid', mode: 'write', score: 1, bonus: true , evLoc: '选做 第3段 (tree)', evQuote: 'These ___ (tree) can live for thousands of years', passage: '简答', refAns: 'trees' },
  { p: 'p2425', no: 48, seg: '阅读选择', fam: 'f-read-detail', topic: '暴食症事实细节', cat: '理解', diff: 'mid', mode: 'select', score: 2, bonus: true , evLoc: '选做 第2段', evQuote: 'When researchers and doctors talk about binge eating, there must be two key symptoms. … It can also lead to weight (体重) gain', passage: '简答', refAns: 'It can lead to health problems' },
  { p: 'p2425', no: 49, seg: '阅读选择', fam: 'f-read-main', topic: '第三段主旨', cat: '综合', diff: 'mid', mode: 'select', score: 2, bonus: true , evLoc: '选做 第3段', evQuote: 'Binge eating often shows up in teens … it’s important to stop it as soon as possible', passage: '简答', refAns: 'Why it is important to study binge eating' },
  { p: 'p2425', no: 50, seg: '阅读选择', fam: 'f-read-infer', topic: '什么情况下会暴食（推断）', cat: '综合', diff: 'mid', mode: 'select', score: 2, bonus: true , evLoc: '选做 第6段', evQuote: 'teenagers who had emotional problems, such as feeling sad, were more likely to binge eat. Also, problems such as arguing with parents … made binge eating more likely', passage: '简答', refAns: 'arguing with a good friend' },
];
