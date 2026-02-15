import type { Field } from '../types/table';

export const DEFAULT_FIELD_WIDTH = 150;
export const HEIGHT_PER_ROW = 21;
export const ROW_PADDING = 11.5

// Field Types
export const FIELD_TYPE_TEXT = 'TEXT';
export const FIELD_TYPE_NUMBER = 'NUMBER';
export const FIELD_TYPE_DATE = 'DATE';
export const FIELD_TYPE_SINGLE_SELECT = 'SINGLE_SELECT';
export const FIELD_TYPE_MULTI_SELECT = 'MULTI_SELECT';
export const FIELD_TYPE_USER = 'USER';
export const FIELD_TYPE_GROUP = 'GROUP';
export const FIELD_TYPE_ATTACHMENT = 'ATTACHMENT';
export const FIELD_TYPE_CHECKBOX = 'CHECKBOX';
export const FIELD_TYPE_URL = 'URL';
export const FIELD_TYPE_FORMULA = 'FORMULA';
export const FIELD_TYPE_LOOKUP = 'LOOKUP';

export const FIELD_TYPE_WORKFLOW = 'WORKFLOW';
export const FIELD_TYPE_BUTTON = 'BUTTON';
export const FIELD_TYPE_AUTO_NUMBER = 'AUTO_NUMBER';
export const FIELD_TYPE_PHONE = 'PHONE';
export const FIELD_TYPE_EMAIL = 'EMAIL';
export const FIELD_TYPE_LOCATION = 'LOCATION';
export const FIELD_TYPE_BARCODE = 'BARCODE';
export const FIELD_TYPE_PROGRESS = 'PROGRESS';
export const FIELD_TYPE_CURRENCY = 'CURRENCY';
export const FIELD_TYPE_RATING = 'RATING';

export const FIELD_TYPE_LINK_BIDIRECTIONAL = 'LINK_BIDIRECTIONAL';
export const FIELD_TYPE_LINK_UNIDIRECTIONAL = 'LINK_UNIDIRECTIONAL';
export const FIELD_TYPE_CREATED_BY = 'CREATED_BY';
export const FIELD_TYPE_UPDATED_BY = 'UPDATED_BY';
export const FIELD_TYPE_CREATED_TIME = 'CREATED_TIME';
export const FIELD_TYPE_UPDATED_TIME = 'UPDATED_TIME';

export const fieldTypeMeta: Record<Field['type'], { icon?: string; text?: string; label?: string }> = {
  // Routine
  [FIELD_TYPE_TEXT]: { icon: 'i-lucide-align-left', label: '文本' },
  [FIELD_TYPE_NUMBER]: { icon: 'i-lucide-hash', label: '数字' },
  [FIELD_TYPE_DATE]: { icon: 'i-lucide-calendar', label: '日期' },
  [FIELD_TYPE_SINGLE_SELECT]: { icon: 'i-lucide-circle-check', label: '单选' },
  [FIELD_TYPE_MULTI_SELECT]: { icon: 'i-lucide-list-checks', label: '多选' },
  [FIELD_TYPE_USER]: { icon: 'i-lucide-user', label: '人员' },
  [FIELD_TYPE_GROUP]: { icon: 'i-lucide-users', label: '群组' },
  [FIELD_TYPE_ATTACHMENT]: { icon: 'i-lucide-paperclip', label: '附件' },
  [FIELD_TYPE_CHECKBOX]: { icon: 'i-lucide-square-check', label: '复选框' },
  [FIELD_TYPE_URL]: { icon: 'i-lucide-link', label: '超链接' },
  [FIELD_TYPE_FORMULA]: { icon: 'i-lucide-calculator', label: '公式' },
  [FIELD_TYPE_LOOKUP]: { icon: 'i-lucide-search', label: '查找引用' },

  // Business
  [FIELD_TYPE_WORKFLOW]: { icon: 'i-lucide-workflow', label: '流程' },
  [FIELD_TYPE_BUTTON]: { icon: 'i-lucide-square', label: '按钮' },
  [FIELD_TYPE_AUTO_NUMBER]: { icon: 'i-lucide-list-ordered', label: '自动编号' },
  [FIELD_TYPE_PHONE]: { icon: 'i-lucide-phone', label: '电话号码' },
  [FIELD_TYPE_EMAIL]: { icon: 'i-lucide-mail', label: 'Email' },
  [FIELD_TYPE_LOCATION]: { icon: 'i-lucide-map-pin', label: '地理位置' },
  [FIELD_TYPE_BARCODE]: { icon: 'i-lucide-qr-code', label: '条码' },
  [FIELD_TYPE_PROGRESS]: { icon: 'i-lucide-bar-chart', label: '进度' },
  [FIELD_TYPE_CURRENCY]: { icon: 'i-lucide-dollar-sign', label: '货币' },
  [FIELD_TYPE_RATING]: { icon: 'i-lucide-star', label: '评分' },

  // Advanced
  [FIELD_TYPE_LINK_BIDIRECTIONAL]: { icon: 'i-lucide-arrow-left-right', label: '双向关联' },
  [FIELD_TYPE_LINK_UNIDIRECTIONAL]: { icon: 'i-lucide-arrow-right', label: '单向关联' },
  [FIELD_TYPE_CREATED_BY]: { icon: 'i-lucide-user-plus', label: '创建人' },
  [FIELD_TYPE_UPDATED_BY]: { icon: 'i-lucide-user-pen', label: '修改人' },
  [FIELD_TYPE_CREATED_TIME]: { icon: 'i-lucide-calendar-plus', label: '创建时间' },
  [FIELD_TYPE_UPDATED_TIME]: { icon: 'i-lucide-history', label: '最后更新时间' },
};

export const rowHeightOptions = [
  { value: 1, label: '低', iconClass: 'i-lucide-minus' },
  { value: 2, label: '中等', iconClass: 'i-lucide-equal' },
  { value: 4, label: '高', iconClass: 'i-lucide-align-justify' },
  { value: 6, label: '超高', iconClass: 'i-lucide-list' },
] as const;

export const STAT_NONE = 'none';
export const STAT_COUNT_ALL = 'countAll';
export const STAT_EMPTY = 'empty';
export const STAT_FILLED = 'filled';
export const STAT_PERCENT_EMPTY = 'percentEmpty';
export const STAT_PERCENT_FILLED = 'percentFilled';

export const statOptions = [
  { label: '不展示', value: STAT_NONE },
  { label: '记录总数', value: STAT_COUNT_ALL },
  { label: '未填写', value: STAT_EMPTY },
  { label: '已填写', value: STAT_FILLED },
  { label: '未填写占比', value: STAT_PERCENT_EMPTY },
  { label: '已填写占比', value: STAT_PERCENT_FILLED },
];

const createFieldOptions = (label: string, types: Field['type'][]) => ({
  label,
  items: types.map(type => ({
    label: fieldTypeMeta[type].label || type,
    value: type,
    icon: fieldTypeMeta[type].icon
  }))
});

export const fieldTypeOptions = [
  createFieldOptions('常规', [
    FIELD_TYPE_TEXT,
    FIELD_TYPE_SINGLE_SELECT,
    FIELD_TYPE_MULTI_SELECT,
    FIELD_TYPE_USER,
    // FIELD_TYPE_GROUP,
    FIELD_TYPE_DATE,
    FIELD_TYPE_ATTACHMENT,
    FIELD_TYPE_NUMBER,
    FIELD_TYPE_CHECKBOX,
    FIELD_TYPE_URL,
    FIELD_TYPE_FORMULA,
    FIELD_TYPE_LOOKUP,
  ]),
  createFieldOptions('业务', [
    FIELD_TYPE_WORKFLOW,
    FIELD_TYPE_BUTTON,
    FIELD_TYPE_AUTO_NUMBER,
    FIELD_TYPE_PHONE,
    FIELD_TYPE_EMAIL,
    FIELD_TYPE_LOCATION,
    FIELD_TYPE_BARCODE,
    FIELD_TYPE_PROGRESS,
    FIELD_TYPE_CURRENCY,
    FIELD_TYPE_RATING,
  ]),
  createFieldOptions('高级', [
    FIELD_TYPE_LINK_BIDIRECTIONAL,
    FIELD_TYPE_LINK_UNIDIRECTIONAL,
    FIELD_TYPE_CREATED_BY,
    FIELD_TYPE_UPDATED_BY,
    FIELD_TYPE_CREATED_TIME,
    FIELD_TYPE_UPDATED_TIME,
  ])
];

export const dateFormatOptions = [
  { label: '2026/01/30', value: 'YYYY/MM/DD' },
  { label: '2026/01/30 14:00', value: 'YYYY/MM/DD HH:mm' },
  { label: '2026/01/30 14:00 (GMT+8)', value: 'YYYY/MM/DD HH:mm (z)' },
  { label: '2026-01-30', value: 'YYYY-MM-DD' },
  { label: '2026-01-30 14:00', value: 'YYYY-MM-DD HH:mm' },
  { label: '2026-01-30 14:00 (GMT+8)', value: 'YYYY-MM-DD HH:mm (z)' },
  { label: '01-30', value: 'MM-DD' },
  { label: '01/30/2026', value: 'MM/DD/YYYY' },
  { label: '30/01/2026', value: 'DD/MM/YYYY' }
];

export function formatDate(value: any, field?: Field) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    // Default format if no config
    let format = field?.config?.dateFormat || 'YYYY-MM-DD HH:mm';

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    
    // Replace tokens
    return format
      .replace('YYYY', String(y))
      .replace('MM', m)
      .replace('DD', d)
      .replace('HH', h)
      .replace('mm', min)
      .replace('ss', s)
      .replace('(z)', '');
  } catch (e) {
    return value;
  }
}

export const numberFormatOptions = [
  { label: '整数', value: 'integer' },
  { label: '千分位', value: 'thousands' },
  { label: '千分位 (小数点)', value: 'thousands-decimal' },
  { label: '保留 1 位小数', value: 'decimal-1' },
  { label: '保留 2 位小数', value: 'decimal-2' },
  { label: '保留 3 位小数', value: 'decimal-3' },
  { label: '保留 4 位小数', value: 'decimal-4' },
  { label: '保留 5 位小数', value: 'decimal-5' },
  { label: '保留 6 位小数', value: 'decimal-6' },
  { label: '保留 7 位小数', value: 'decimal-7' },
  { label: '保留 8 位小数', value: 'decimal-8' },
  { label: '保留 9 位小数', value: 'decimal-9' },
  { label: '百分比', value: 'percent' },
  { label: '百分比 (小数点)', value: 'percent-decimal' }
];