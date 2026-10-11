// 虚构示例数据（全部为虚构，仅用于功能验证，对应验收剧本 A—J 的关键场景）
import type { DB } from '@/types';

function d(offset: number): string {
  const t = new Date(); t.setDate(t.getDate() + offset);
  return t.toISOString().slice(0, 10);
}

export function seedDB(): DB {
  return {
    families: [
      { id: 'fam1', name: '林家（示例）', note: '转介绍来源：口碑' },
      { id: 'fam2', name: '陈家（示例）' },
      { id: 'fam3', name: '王家（示例）' },
    ],
    contacts: [
      { id: 'c1', familyId: 'fam1', name: '林妈妈', relation: '母亲', wechat: 'lin-mama-demo', isPayer: true },
      { id: 'c2', familyId: 'fam1', name: '林爸爸', relation: '父亲', phone: '138****0000' },
      { id: 'c3', familyId: 'fam2', name: '陈妈妈', relation: '母亲', wechat: 'chen-mama-demo', isPayer: true },
      { id: 'c4', familyId: 'fam3', name: '王奶奶', relation: '祖母', wechat: 'wang-nai-demo', isPayer: true },
    ],
    students: [
      { id: 'stu1', familyId: 'fam1', name: '林小舟', stage: '服务中', school: '示例第二中学', grade: '初二', channel: '企业微信咨询', tags: ['目标感待建立', '数学薄弱'], firstConsultDate: d(-40), firstEnrollDate: d(-33), createdAt: d(-45) },
      { id: 'stu2', familyId: 'fam2', name: '陈一诺', stage: '服务中', school: '示例外国语学校', grade: '五年级', channel: '转介绍', tags: ['英语优势'], referredBy: 'stu1', firstConsultDate: d(-20), firstEnrollDate: d(-14), createdAt: d(-22) },
      { id: 'stu3', familyId: 'fam3', name: '王思远', stage: '潜在', school: '示例实验小学', grade: '三年级', channel: '公众号留言', tags: [], createdAt: d(-3) },
    ],
    needs: [
      { id: 'n1', studentId: 'stu1', proposer: '学生', original: '数学考试总是做不完，想提高速度', expectation: '期末数学提升一个等级', direction: '弱势学科', status: '已确认', createdAt: d(-40) },
      { id: 'n2', studentId: 'stu1', proposer: '父母', original: '希望孩子能自己安排学习，不用催', expectation: '建立每日学习计划习惯', direction: '自控与行动', status: '已确认', createdAt: d(-40) },
      { id: 'n3', studentId: 'stu2', proposer: '父母', original: '英语口语不错但阅读弱', direction: '弱势学科', status: '待确认', createdAt: d(-20) },
    ],
    products: [
      { id: 'p1', name: '学习力一对一陪跑（12次）', form: '一对一', version: 2, price: 4800, unit: '期(12课时)', deductRule: '签到核销', refundRule: '已上课时按单价400元扣除后退还余额', plannedCount: 12, status: '可售', createdAt: d(-60) },
      { id: 'p2', name: '学习方法小班课', form: '小班', version: 1, price: 1600, unit: '期(8课时)', deductRule: '服务完成核销', refundRule: '开课前全退，开课后按已上课时折算', plannedCount: 8, status: '可售', createdAt: d(-30) },
      { id: 'p3', name: '首次咨询（不计课时）', form: '一对一', version: 1, price: 199, unit: '次', deductRule: '不自动核销', refundRule: '开始前24小时可退', status: '可售', createdAt: d(-90) },
    ],
    enrollments: [
      { id: 'en1', studentId: 'stu1', productId: 'p1', snapshot: { productName: '学习力一对一陪跑（12次）', version: 2, price: 4800, unit: '期(12课时)', deductRule: '签到核销', refundRule: '已上课时按单价400元扣除后退还余额', plannedCount: 12 }, startDate: d(-33), totalUnits: 12, status: '服务中', createdAt: d(-33) },
      { id: 'en2', studentId: 'stu2', productId: 'p2', snapshot: { productName: '学习方法小班课', version: 1, price: 1600, unit: '期(8课时)', deductRule: '服务完成核销', refundRule: '开课前全退，开课后按已上课时折算', plannedCount: 8 }, startDate: d(-14), totalUnits: 8, status: '服务中', createdAt: d(-14) },
    ],
    sessions: [
      { id: 's1', type: '一对一咨询', title: '林小舟 第5次咨询', studentId: 'stu1', date: d(0), start: '09:30', end: '10:15', location: '线上', prepNote: '复盘上周数学限时训练；准备时间管理表', status: '计划' },
      { id: 's2', type: '班课', title: '学习方法小班 第3课', date: d(0), start: '14:00', end: '15:30', location: '教室A', prepNote: '打印错题整理模板 6 份', status: '计划' },
      { id: 's3', type: '一对一咨询', title: '林小舟 第4次咨询', studentId: 'stu1', date: d(-7), start: '09:30', end: '10:15', location: '线上', status: '已完成', completedAt: d(-7) },
      { id: 's4', type: '一对一咨询', title: '王思远 首次咨询', studentId: 'stu3', date: d(1), start: '19:00', end: '19:45', location: '线上', prepNote: '查看公众号留言记录', status: '计划' },
      { id: 's5', type: '研发', title: '学习力营大纲打磨', date: d(2), start: '10:00', end: '11:30', status: '计划' },
    ],
    attendance: [
      { id: 'a1', sessionId: 's3', studentId: 'stu1', status: '出勤', checkinAt: d(-7) + 'T09:28', corrections: [] },
    ],
    ledger: [
      { id: 'l0', enrollmentId: 'en1', type: '增加', qty: 12, unit: '课时', reason: '报名初始权益（快照 v2）', createdAt: d(-33) },
      { id: 'l1', enrollmentId: 'en1', type: '核销', qty: 1, unit: '课时', reason: '第1次咨询签到', sessionId: 's0a', createdAt: d(-28) },
      { id: 'l2', enrollmentId: 'en1', type: '核销', qty: 1, unit: '课时', reason: '第2次咨询签到', sessionId: 's0b', createdAt: d(-21) },
      { id: 'l3', enrollmentId: 'en1', type: '核销', qty: 1, unit: '课时', reason: '第3次咨询签到', sessionId: 's0c', createdAt: d(-14) },
      { id: 'l4', enrollmentId: 'en1', type: '核销', qty: 1, unit: '课时', reason: '第4次咨询签到', sessionId: 's3', createdAt: d(-7) },
      { id: 'l5', enrollmentId: 'en2', type: '增加', qty: 8, unit: '课时', reason: '报名初始权益（小班第1期）', createdAt: d(-14) },
      { id: 'l6', enrollmentId: 'en2', type: '核销', qty: 1, unit: '课时', reason: '小班第1课完成', createdAt: d(-12) },
      { id: 'l7', enrollmentId: 'en2', type: '核销', qty: 1, unit: '课时', reason: '小班第2课完成', createdAt: d(-5) },
    ],
    serviceRecords: [
      { id: 'r1', studentId: 'stu1', sessionId: 's3', seq: 4, date: d(-7), summary: '数学限时训练完成率提升到 70%；约定每日 20 分钟口算', content: '【事实】限时训练 20 题完成 14 题，正确率 86%。【观察】中段注意力下降明显。【约定】每日 20 分钟口算 + 周中自测一次。【待核对】家长提到的校内月考日期需确认。', sourceType: '手写识别', docLocation: '飞书文档：林小舟咨询记录（示例链接）', aiScope: '仅摘要可供 AI 使用', archiveStatus: '已归档', feedbackStatus: '已交付', pendingCheck: ['校内月考日期'], nextAction: '本次咨询跟进自测结果', createdAt: d(-7) },
      { id: 'r2', studentId: 'stu1', seq: 3, date: d(-14), summary: '建立错题分类习惯；确定数学为第一阶段重点', content: '【事实】完成错题本初分三类。【建议】先稳基础题速度。', sourceType: '文字', docLocation: '工作台存储', aiScope: '全文可供 AI 使用', archiveStatus: '已归档', feedbackStatus: '已交付', pendingCheck: [], createdAt: d(-14) },
      { id: 'r3', studentId: 'stu2', seq: 1, date: d(-12), summary: '小班第1课：学习计划表入门', content: '【事实】完成个人周计划表初稿。', sourceType: '文字', docLocation: '飞书文档：小班记录（示例链接）', aiScope: '不供 AI 使用', archiveStatus: '待核对', feedbackStatus: '待确认', pendingCheck: ['出勤名单与课表核对'], createdAt: d(-12) },
    ],
    exams: [
      { id: 'e1', studentId: 'stu1', date: d(-35), name: '初二上月考', stage: '初二上', subjects: [
        { name: '数学', score: 78, full: 120, status: '有效' },
        { name: '语文', score: 92, full: 120, status: '有效' },
        { name: '英语', score: 95, full: 100, status: '有效' },
      ], comment: '数学时间分配问题突出' },
      { id: 'e2', studentId: 'stu1', date: d(-5), name: '初二上期中（示例）', stage: '初二上', subjects: [
        { name: '数学', score: 89, full: 120, status: '有效' },
        { name: '语文', score: null, full: 120, status: '缺考' },
        { name: '英语', score: 96, full: 100, status: '有效' },
      ], comment: '语文因病缺考（缺考不记零）' },
    ],
    finances: [
      { id: 'f1', kind: '应收', amountCents: 480000, currency: 'CNY', date: d(-33), enrollmentId: 'en1', payer: '林妈妈', note: '陪跑12次报名应收（快照v2）', status: '正常', createdAt: d(-33) },
      { id: 'f2', kind: '收款', amountCents: 480000, currency: 'CNY', date: d(-32), enrollmentId: 'en1', payer: '林妈妈', note: '全款', status: '正常', createdAt: d(-32) },
      { id: 'f3', kind: '应收', amountCents: 160000, currency: 'CNY', date: d(-14), enrollmentId: 'en2', payer: '陈妈妈', note: '小班课应收', status: '正常', createdAt: d(-14) },
      { id: 'f4', kind: '收款', amountCents: 80000, currency: 'CNY', date: d(-13), enrollmentId: 'en2', payer: '陈妈妈', note: '分期第1期', status: '正常', createdAt: d(-13) },
      { id: 'f5', kind: '支出', amountCents: 12000, currency: 'CNY', date: d(-6), note: '打印资料费', status: '正常', createdAt: d(-6) },
    ],
    docRefs: [
      { id: 'doc1', title: '林小舟陪跑服务合同', storageType: '老师电脑本地', location: 'D:\\合同\\2026\\林小舟-陪跑合同.pdf', studentId: 'stu1', enrollmentId: 'en1', summary: '服务期12次，有效期4个月；退费按快照规则', aiScope: '仅约定摘要可供 AI 使用', valid: true, createdAt: d(-33) },
      { id: 'doc2', title: '林小舟第4次咨询记录', storageType: '云文档', location: '飞书文档（示例链接）', studentId: 'stu1', summary: '限时训练复盘与口算约定', aiScope: '仅摘要可供 AI 使用', valid: true, createdAt: d(-7) },
      { id: 'doc3', title: '陈一诺小班报名表', storageType: '云文档', location: '飞书文档（示例链接）', studentId: 'stu2', enrollmentId: 'en2', summary: '小班第1期报名信息', aiScope: '不供 AI 使用', valid: true, createdAt: d(-14) },
    ],
    tasks: [
      { id: 't1', title: '整理林小舟第4次咨询的家长反馈（待确认→交付）', status: '待处理', quadrant: '重要不紧急', dueDate: d(1), source: '服务后续', linkedLabel: '林小舟 · 第4次咨询', doneLog: [], createdAt: d(-7) },
      { id: 't2', title: '准备林小舟第5次咨询（时间管理表）', status: '进行中', quadrant: '重要且紧急', dueDate: d(0), source: '课次生成', linkedLabel: '今日 09:30', doneLog: [], createdAt: d(-3) },
      { id: 't3', title: '跟进王思远家长确认首次咨询时间', status: '等待中', quadrant: null, dueDate: d(0), source: '手工', waitingFor: '王奶奶确认今晚时间', waitingNext: d(0), linkedLabel: '王思远（潜在）', doneLog: [], createdAt: d(-2) },
      { id: 't4', title: '学习力营大纲第2版', status: '进行中', quadrant: '重要不紧急', dueDate: d(3), source: '研发项目', linkedLabel: '学习力营', doneLog: [], createdAt: d(-5) },
      { id: 't5', title: '收集本周爆款内容样本（公众号主题：学习习惯）', status: '待处理', quadrant: '不重要不紧急', dueDate: d(2), source: '内容情报', doneLog: [], createdAt: d(-1) },
    ],
    topFocus: [],
    ideas: [
      { id: 'i1', text: '把「错题三色分类法」做成一页可打印模板', tags: ['教学服务'], status: '已转化', conversions: [{ kind: '研发项目', label: '学习力营资料包', at: d(-4) }], createdAt: d(-8) },
      { id: 'i2', text: '公众号选题：为什么孩子计划表总是坚持不过一周', tags: ['内容选题'], status: '待整理', conversions: [], createdAt: d(-2) },
    ],
    knowledge: [
      { id: 'k1', title: '学习科学：间隔重复综述（示例条目）', source: 'scholar 检索示例', zone: '公共专业', aiAllowed: true, summary: '间隔重复对长期记忆的元分析结论，供课程研发引用', createdAt: d(-15) },
      { id: 'k2', title: '我的咨询提问清单 v3', source: '个人整理', zone: '老师个人', aiAllowed: true, summary: '首次咨询 12 个关键提问', createdAt: d(-30) },
      { id: 'k3', title: '学员案例（待匿名化审阅）', source: '服务记录', zone: '受限学员', aiAllowed: false, summary: '匿名化审阅通过前不进入 AI 上下文', createdAt: d(-9) },
    ],
    devProjects: [
      { id: 'dp1', kind: '学习力营', title: '暑期学习力营（3天）', stage: '结构与交付', milestones: [
        { label: '目标人群与问题定义', done: true },
        { label: '概念与定位', done: true },
        { label: '三日大纲', done: false },
        { label: '资料包初稿', done: false },
        { label: '小规模试用', done: false },
      ], nextAction: '大纲第2版（任务 t4）', createdAt: d(-10) },
    ],
    contents: [
      { id: 'ct1', platform: '公众号', title: '示例爆款：一个动作让孩子主动写作业', author: '示例账号A', link: 'https://example.com/a', publishedAt: d(-6), collectedAt: d(-5), metrics: '阅读 10万+（采样时间 ' + d(-5) + '）', status: '收集', verified: true },
      { id: 'ct2', platform: '小红书', title: '示例：初中生时间管理表模板', author: '示例账号B', publishedAt: d(-3), collectedAt: d(-2), status: '选题', verified: false },
    ],
    cooperations: [
      { id: 'co1', org: '示例成长中心', purpose: '暑期营地联合招募', status: '交流中', nextStep: '对方回复分成方案（等待中）', createdAt: d(-8) },
    ],
    profile: {
      current: { version: 2, effectiveDate: d(-20), vision: '帮助 1000 个家庭建立可持续的学习系统', advantages: '结构化拆解、陪跑式跟进、家校沟通', tenYearGoal: '成为区域内有口碑的学习力教练，形成可复制的课程体系', currentGap: '课程产品化程度不足；公域获客刚起步' },
      history: [
        { version: 1, effectiveDate: d(-80), vision: '（初版）做好每一个咨询', advantages: '耐心、记录细致', tenYearGoal: '待定', currentGap: '方向不清' },
      ],
    },
    modulePrefs: ALL_MODULE_PREFS(),
    usage: [
      { month: '上月（示例）', aiCalls: 96, reviewCount: 2, transcribeMin: 118, images: 22, storageMB: 320, note: '单价待报价，仅记录用量' },
    ],
  };
}

function ALL_MODULE_PREFS() {
  return [
    { key: 'dashboard', label: '今日工作台', enabled: true, hidden: false },
    { key: 'planning', label: '年月周日规划', enabled: true, hidden: false },
    { key: 'schedule', label: '课表与日程', enabled: true, hidden: false },
    { key: 'tasks', label: '任务与时间', enabled: true, hidden: false },
    { key: 'clients', label: '客户与学员', enabled: true, hidden: false },
    { key: 'products', label: '产品与报名', enabled: true, hidden: false },
    { key: 'finance', label: '财务', enabled: true, hidden: false },
    { key: 'documents', label: '合同与文档', enabled: true, hidden: false },
    { key: 'growth', label: '人生与事业', enabled: true, hidden: false },
    { key: 'knowledge', label: '知识与灵感', enabled: true, hidden: false },
    { key: 'business', label: '经营与内容', enabled: true, hidden: false },
    { key: 'settings', label: '设置与接入', enabled: true, hidden: false },
  ];
}
