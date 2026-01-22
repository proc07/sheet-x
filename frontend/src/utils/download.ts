import type { Attachment } from '../stores/work';

export function downloadFile(file: Attachment) {
  const a = document.createElement('a');
  a.href = file.url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}