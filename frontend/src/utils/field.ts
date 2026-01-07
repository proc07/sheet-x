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
