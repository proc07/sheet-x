import type { Field } from '../stores/work';

export const DEFAULT_FIELD_WIDTH = 120;
export const HEIGHT_PER_ROW = 21;

export const fieldTypeMeta: Record<Field['type'], { icon?: string; text?: string }> = {
  TEXT: { icon: 'pi-pen-to-square' },
  NUMBER: { icon: 'pi-sort-numeric-up' },
  DATE: { icon: 'pi pi-calendar-clock' },
  SINGLE_SELECT: { icon: 'pi pi-check-circle' },
  MULTI_SELECT: { icon: 'pi pi-list-check' },
  USER: { icon: 'pi pi-user' },
  ATTACHMENT: { icon: 'pi pi-paperclip' },
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

export const fieldTypeOptions = [
  { label: '文本', value: 'TEXT' },
  { label: '数字', value: 'NUMBER' },
  { label: '日期', value: 'DATE' },
  { label: '单选', value: 'SINGLE_SELECT' },
  { label: '多选', value: 'MULTI_SELECT' },
];
