import type { Field } from '../stores/work';

export function defaultOptionsForField(type: Field['type']) {
  if (type === 'SINGLE_SELECT' || type === 'MULTI_SELECT') {
    return {
      choices: [
        { id: 'opt1', label: '选项1' },
        { id: 'opt2', label: '选项2' },
      ],
    };
  }
  return undefined;
}

export function isSameTime(a: string | Date, b: string | Date) {
  return new Date(a).getTime() === new Date(b).getTime();
}

export function normalizeRowHeight(value?: number) {
  return value === 1 || value === 2 || value === 4 || value === 6 ? value : 1;
}