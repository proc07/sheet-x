import { fieldTypeMeta } from '../constants/table';
import type { Attachment, Field } from '../stores/work';

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

export function getFieldTypeIcon(type: Field['type']) {
  return fieldTypeMeta[type]?.icon ?? 'pi-question';
}

export function isImage(file: Attachment) {
  return file?.type?.startsWith('image/');
}

export function getFileIcon(file: Attachment) {
  if (!file?.type) return 'pi-file text-slate-500';
  if (file.type.includes('pdf')) return 'pi-file-pdf text-red-500';
  if (file.type.includes('word') || file.type.includes('document')) return 'pi-file-word text-blue-500';
  if (file.type.includes('excel') || file.type.includes('sheet')) return 'pi-file-excel text-green-500';
  if (file.type.includes('zip') || file.type.includes('compressed')) return 'pi-box text-orange-500';
  return 'pi-file text-slate-500';
}
