import type { Field } from '../stores/work';

export const DEFAULT_FIELD_WIDTH = 120;
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
  [FIELD_TYPE_TEXT]: { icon: 'pi-align-left', label: '文本' },
  [FIELD_TYPE_NUMBER]: { icon: 'pi-hashtag', label: '数字' },
  [FIELD_TYPE_DATE]: { icon: 'pi pi-calendar', label: '日期' },
  [FIELD_TYPE_SINGLE_SELECT]: { icon: 'pi pi-check-circle', label: '单选' },
  [FIELD_TYPE_MULTI_SELECT]: { icon: 'pi pi-list-check', label: '多选' },
  [FIELD_TYPE_USER]: { icon: 'pi pi-user', label: '人员' },
  [FIELD_TYPE_GROUP]: { icon: 'pi pi-users', label: '群组' },
  [FIELD_TYPE_ATTACHMENT]: { icon: 'pi pi-paperclip', label: '附件' },
  [FIELD_TYPE_CHECKBOX]: { icon: 'pi pi-check-square', label: '复选框' },
  [FIELD_TYPE_URL]: { icon: 'pi pi-link', label: '超链接' },
  [FIELD_TYPE_FORMULA]: { icon: 'pi pi-calculator', label: '公式' },
  [FIELD_TYPE_LOOKUP]: { icon: 'pi pi-search', label: '查找引用' },

  // Business
  [FIELD_TYPE_WORKFLOW]: { icon: 'pi pi-sitemap', label: '流程' },
  [FIELD_TYPE_BUTTON]: { icon: 'pi pi-box', label: '按钮' },
  [FIELD_TYPE_AUTO_NUMBER]: { icon: 'pi pi-list-ol', label: '自动编号' },
  [FIELD_TYPE_PHONE]: { icon: 'pi pi-phone', label: '电话号码' },
  [FIELD_TYPE_EMAIL]: { icon: 'pi pi-envelope', label: 'Email' },
  [FIELD_TYPE_LOCATION]: { icon: 'pi pi-map-marker', label: '地理位置' },
  [FIELD_TYPE_BARCODE]: { icon: 'pi pi-qrcode', label: '条码' },
  [FIELD_TYPE_PROGRESS]: { icon: 'pi pi-chart-bar', label: '进度' },
  [FIELD_TYPE_CURRENCY]: { icon: 'pi pi-dollar', label: '货币' },
  [FIELD_TYPE_RATING]: { icon: 'pi pi-star', label: '评分' },

  // Advanced
  [FIELD_TYPE_LINK_BIDIRECTIONAL]: { icon: 'pi pi-arrows-alt', label: '双向关联' },
  [FIELD_TYPE_LINK_UNIDIRECTIONAL]: { icon: 'pi pi-arrow-right', label: '单向关联' },
  [FIELD_TYPE_CREATED_BY]: { icon: 'pi pi-user-plus', label: '创建人' },
  [FIELD_TYPE_UPDATED_BY]: { icon: 'pi pi-user-edit', label: '修改人' },
  [FIELD_TYPE_CREATED_TIME]: { icon: 'pi pi-calendar-plus', label: '创建时间' },
  [FIELD_TYPE_UPDATED_TIME]: { icon: 'pi pi-history', label: '最后更新时间' },
};

export const rowHeightOptions = [
  { value: 1, label: '低', iconClass: 'pi-minus' },
  { value: 2, label: '中等', iconClass: 'pi-equals' },
  { value: 4, label: '高', iconClass: 'pi-bars' },
  { value: 6, label: '超高', iconClass: 'pi-align-justify' },
] as const;

export const statOptions = [
  { label: '不展示', value: 'none' },
  { label: '记录总数', value: 'countAll' },
  { label: '未填写', value: 'empty' },
  { label: '已填写', value: 'filled' },
  { label: '未填写占比', value: 'percentEmpty' },
  { label: '已填写占比', value: 'percentFilled' },
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