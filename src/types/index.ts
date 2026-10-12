// 学习力工作台 - 数据类型定义（逻辑模型，对应实施方案 v1.0 第四章）
// 本版本为前端验证版：数据存储在浏览器 localStorage，不上传服务器。

export type ID = string;

// ---- 客户与学员 ----
export type StudentStage = '潜在' | '已咨询' | '已报名' | '服务中' | '暂停' | '结案';

export interface Family { id: ID; name: string; note?: string; }
export interface Contact {
  id: ID; familyId: ID; name: string; relation: string;
  wechat?: string; phone?: string; isPayer?: boolean;
}
export interface Student {
  id: ID; familyId: ID; name: string; stage: StudentStage;
  school?: string; grade?: string; channel?: string; tags: string[];
  firstConsultDate?: string; firstEnrollDate?: string; referredBy?: ID; // 转介绍来源学员
  createdAt: string;
}
export interface Need {
  id: ID; studentId: ID; proposer: '学生' | '父母' | '共同';
  original: string; expectation?: string; direction?: string;
  status: '待确认' | '已确认'; createdAt: string;
}

// ---- 产品与报名 ----
export type ProductForm = '一对一' | '小班' | '大班' | '陪跑';
export type DeductRule = '签到核销' | '服务完成核销' | '不自动核销';
export interface Product {
  id: ID; name: string; form: ProductForm; version: number;
  price: number; // 元
  unit: string; // 课时/次/期
  deductRule: DeductRule; refundRule: string; plannedCount?: number; // 如 12 次计划
  status: '草稿' | '可售' | '停售'; createdAt: string;
}
export interface EnrollmentSnapshot { productName: string; version: number; price: number; unit: string; deductRule: DeductRule; refundRule: string; plannedCount?: number; }
export interface Enrollment {
  id: ID; studentId: ID; productId: ID; snapshot: EnrollmentSnapshot;
  startDate: string; totalUnits: number; status: '服务中' | '暂停' | '结案';
  createdAt: string;
}

// ---- 课次 / 考勤 / 课时账 ----
export type SessionType = '一对一咨询' | '班课' | '陪跑' | '研发' | '个人';
export type SessionStatus = '计划' | '已完成' | '已取消';
export type MeetingProvider = '腾讯会议' | '飞书会议' | '其他' | '线下';
export interface Session {
  id: ID; type: SessionType; title: string; studentId?: ID;
  date: string; // YYYY-MM-DD
  start: string; end: string; // HH:MM，精确到分钟
  location?: string; prepNote?: string; status: SessionStatus;
  completedAt?: string; seriesId?: string;
  // P08：保留腾讯会议，按条件升级；飞书会议为备选，不强制迁移
  meetingProvider?: MeetingProvider; meetingLink?: string; meetingId?: string;
}
export type AttStatus = '出勤' | '迟到' | '请假' | '缺勤';
// P08：发链接、点击链接、参会、有效出勤、服务完成、扣课是不同状态
export type AttEvidence = '手动确认' | '参会证据匹配' | '未确认';
export interface Attendance {
  id: ID; sessionId: ID; studentId: ID; status: AttStatus;
  evidence: AttEvidence; // 默认手动确认；无证据标未确认，不自动判缺勤
  checkinAt: string; corrections: { at: string; from: AttStatus; to: AttStatus; reason: string }[];
}
export type LedgerType = '增加' | '核销' | '补回' | '失效' | '退款冲销';
export interface Ledger {
  id: ID; enrollmentId: ID; type: LedgerType; qty: number; unit: string;
  reason: string; sessionId?: ID; reversedBy?: ID; createdAt: string;
}

// ---- 服务记录 / 成绩 ----
export type FeedbackStatus = '待整理' | '待确认' | '待交付' | '已交付';
export type ArchiveStatus = '草稿' | '待核对' | '已归档';
export interface ServiceRecord {
  id: ID; studentId: ID; sessionId?: ID; seq: number; date: string;
  summary: string; content: string; sourceType: '文字' | '手写识别' | '录音转写';
  docLocation: string; aiScope: string;
  archiveStatus: ArchiveStatus; feedbackStatus: FeedbackStatus;
  pendingCheck: string[]; nextAction?: string; createdAt: string;
}
export interface ExamSubject { name: string; score: number | null; full: number; status: '有效' | '缺考' | '缺失'; }
export interface Exam { id: ID; studentId: ID; date: string; name: string; stage: string; subjects: ExamSubject[]; comment?: string; }

// ---- 财务（金额单位：分，定点计算） ----
export type FinKind = '应收' | '收款' | '退款' | '支出';
export interface Finance {
  id: ID; kind: FinKind; amountCents: number; currency: string; date: string;
  enrollmentId?: ID; payer?: string; note: string;
  status: '正常' | '已冲销'; reversedBy?: ID; createdAt: string;
}

// ---- 合同与文档索引 ----
export type ExternalUseStatus = '待确认' | '允许' | '禁止' | '已撤回';
export interface DocRef {
  id: ID; title: string; storageType: '老师电脑本地' | '云文档' | '工作台存储' | '飞书素材';
  location: string; studentId?: ID; enrollmentId?: ID;
  summary: string; aiScope: string; valid: boolean; createdAt: string;
  // P05/P03：对外使用确认状态与脱敏版本位置（新增资料默认待确认）
  externalUse?: ExternalUseStatus; redactedRef?: string; sourceNote?: string;
}

// ---- 任务 / 等待 / 三重点 ----
export type TaskStatus = '待处理' | '进行中' | '等待中' | '完成' | '取消';
export type Quadrant = '重要且紧急' | '重要不紧急' | '紧急不重要' | '不重要不紧急';
export interface Task {
  id: ID; title: string; status: TaskStatus;
  quadrant: Quadrant | null; // null = 待分类（不伪装已知重要性）
  dueDate?: string; // 到期提醒依据，与四象限分开
  source: string; linkedLabel?: string;
  waitingFor?: string; waitingNext?: string;
  doneAt?: string; doneLog: { at: string; action: '完成' | '撤销' }[];
  createdAt: string;
}
export interface TopFocus { date: string; slots: (ID | null)[]; } // 今日三重点，3 个固定位置

// ---- 灵感 / 知识 / 研发 / 经营 ----
export interface Idea {
  id: ID; text: string; tags: string[]; status: '待整理' | '已转化';
  conversions: { kind: string; label: string; at: string }[]; createdAt: string;
}
export interface Knowledge {
  id: ID; title: string; source: string; zone: '公共专业' | '老师个人' | '受限学员';
  aiAllowed: boolean; summary: string; createdAt: string;
}
export interface DevProject {
  id: ID; kind: '沙龙小班' | '学习力营' | '教育产品'; title: string;
  stage: string; milestones: { label: string; done: boolean }[];
  nextAction?: string; createdAt: string;
}
export interface ContentItem {
  id: ID; platform: string; title: string; author?: string; link?: string;
  publishedAt?: string; collectedAt: string; metrics?: string; // 指标口径文本
  status: '收集' | '选题' | '草稿' | '待审' | '已发布' | '归档';
  verified: boolean; // 无指标不得标已验证爆款
}
export interface Cooperation { id: ID; org: string; purpose: string; status: '交流中' | '合作中' | '已结束'; nextStep?: string; createdAt: string; }

// ---- 画像 / 复盘 ----
export interface ProfileVersion {
  version: number; effectiveDate: string;
  vision: string; advantages: string; tenYearGoal: string; currentGap: string;
}
export interface ProfileState { current: ProfileVersion; history: ProfileVersion[]; }

// ---- 模块偏好 / 用量 ----
export interface ModulePref { key: string; label: string; enabled: boolean; hidden: boolean; }
export interface UsageRecord { month: string; aiCalls: number; reviewCount: number; transcribeMin: number; images: number; storageMB: number; note: string; }

// ================= v0.4 增量补丁（P00—P10） =================

// P00 接入能力：凭据不出现在页面；没有调用证据不显示验证通过
export type ProviderState = '仅链接' | '已配置' | '验证通过' | '受限' | '失败';
export interface ProviderCapability {
  id: ID; provider: string; capability: string; state: ProviderState;
  verifiedAt?: string; evidence?: string; lastError?: string; fallback?: string;
}

// P02 文档式 Skill 与规则版本
export interface Rule {
  id: ID; ruleType: string; version: number; status: '草稿' | '已确认';
  confirmedAt?: string; content: string; examples?: string;
}

// P04 客户沟通事实（最近主动触达与最近收到回复分开；无同步记录标未知）
export interface CommEvent {
  id: ID; studentId: ID; contactId?: ID; occurredAt: string;
  direction: '老师发出' | '家长回复' | '未知';
  channel: string; source: '人工录入' | '企业微信同步' | '其他';
  needSummary?: string; nextAction?: string; followupAt?: string;
  coverageState: '已同步' | '人工' | '未知';
}

// P06 精华提取候选：老师定义标准，第一版手动标记；AI 只提候选
export interface MaterialCandidate {
  id: ID; sourceRef: string; sourceLocator: string; originalExcerpt: string;
  context?: string; editedDraft?: string; purpose: string;
  reviewStatus: '候选' | '已接受' | '已拒绝'; createdAt: string;
}

// P08 参会证据（全栈版接腾讯/飞书接口后写入；验证版仅模型）
export interface MeetingEvidence {
  id: ID; sessionId: ID; provider: string; eventId?: string;
  participantRef: string; joinAt: string; leaveAt?: string;
  matchedStudentId?: ID; matchStatus: '已匹配' | '待核对' | '无法匹配';
}

// P01 迁移批次（备份→盘点→预览→小批导入→核对→双设备测试→停止旧写入）
export interface MigrationBatch {
  id: ID; source: string; previewStatus: '预览' | '已确认' | '已回退';
  successCount: number; failedCount: number; rollbackRef?: string; createdAt: string;
}

// P03 内容情报配置（先筛选、再持续采集；热度与业务相关性分开）
export interface CollectionConfig {
  id: ID; targetAudience?: string; themes?: string; platforms?: string;
  excludeTopics?: string; metricStandard?: string; frequency?: string;
  purpose?: string; budget?: string; status: '草稿' | '已确认';
}

export interface DB {
  families: Family[]; contacts: Contact[]; students: Student[]; needs: Need[];
  products: Product[]; enrollments: Enrollment[];
  sessions: Session[]; attendance: Attendance[]; ledger: Ledger[];
  serviceRecords: ServiceRecord[]; exams: Exam[];
  finances: Finance[]; docRefs: DocRef[];
  tasks: Task[]; topFocus: TopFocus[];
  ideas: Idea[]; knowledge: Knowledge[]; devProjects: DevProject[];
  contents: ContentItem[]; cooperations: Cooperation[];
  profile: ProfileState; modulePrefs: ModulePref[]; usage: UsageRecord[];
  // v0.4 增量
  providerCaps: ProviderCapability[]; rules: Rule[]; commEvents: CommEvent[];
  materialCandidates: MaterialCandidate[]; meetingEvidence: MeetingEvidence[];
  migrationBatches: MigrationBatch[]; collectionConfig?: CollectionConfig;
}

// ---- 模块清单（对应 M01—M18 导航组） ----
export const MODULE_GROUPS: { group: string; color: string; items: { key: string; label: string; desc: string }[] }[] = [
  { group: '日常入口', color: '#98341F', items: [
    { key: 'dashboard', label: '今日工作台', desc: '八类首页内容、三重点、时间轴' },
    { key: 'planning', label: '年月周日规划', desc: '多层规划视图' },
    { key: 'schedule', label: '课表与日程', desc: '每小时刻度、任意起止' },
    { key: 'tasks', label: '任务与时间', desc: '四象限、到期提醒、等待事项' },
  ]},
  { group: '核心业务', color: '#42546A', items: [
    { key: 'clients', label: '客户与学员', desc: '家庭、联系人、学员全周期' },
    { key: 'products', label: '产品与报名', desc: '产品版本、报名快照' },
    { key: 'finance', label: '财务', desc: '应收、收款、退款、支出' },
    { key: 'documents', label: '合同与文档', desc: '索引三层信息，原件不上传' },
  ]},
  { group: '个人成长', color: '#7D6477', items: [
    { key: 'growth', label: '人生与事业', desc: '画像版本、阶段复盘' },
    { key: 'knowledge', label: '知识与灵感', desc: '知识库分区、灵感转化、研发项目' },
  ]},
  { group: '对外经营', color: '#6B7BB4', items: [
    { key: 'business', label: '经营与内容', desc: '内容情报、商务合作' },
  ]},
  { group: '基础管理', color: '#A86F59', items: [
    { key: 'settings', label: '设置与接入', desc: '模块管理、接入状态、用量成本、Skill' },
  ]},
];
export const ALL_MODULES = MODULE_GROUPS.flatMap(g => g.items);
export const MODULE_COLORS: Record<string, string> = {
  dashboard: '#98341F', planning: '#98341F', schedule: '#98341F', tasks: '#98341F',
  clients: '#42546A', products: '#42546A', finance: '#4A3934', documents: '#42546A',
  growth: '#7D6477', knowledge: '#747CBD', business: '#6B7BB4', settings: '#A86F59',
};
