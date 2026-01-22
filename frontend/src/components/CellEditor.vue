<template>
  <Textarea
    v-if="field.type === FIELD_TYPE_TEXT"
    v-model="local"
    size="small"
    class="w-full h-full cell-textarea !absolute left-0 top-0 px-2"
    placeholder=""
  />

  <InputNumber
    v-else-if="field.type === FIELD_TYPE_NUMBER"
    v-model="local"
    size="small"
    v-bind="numberFieldProps"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    inputClass="w-full h-full !rounded-none border-none outline-none shadow-none"
    placeholder=""
    @keydown.enter.prevent="commit"
  />

  <DatePicker
    v-else-if="field.type === FIELD_TYPE_DATE"
    v-model="local"
    size="small"
    :dateFormat="calendarDateFormat"
    :showTime="calendarShowTime"
    hourFormat="24"
    class="w-full h-full !absolute left-0 top-0"
    panelClass="cell-editor-overlay"
    inputClass="w-full !rounded-none"
    @show="onOverlayShow"
  />

  <Select
    v-else-if="field.type === FIELD_TYPE_SINGLE_SELECT"
    ref="dropdownRef"
    v-model="local"
    size="small"
    filter
    filterName="name"
    :options="choices"
    optionLabel="name"
    optionValue="id"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    panelClass="cell-editor-overlay"
    @show="onOverlayShow"
  >
  </Select>

  <MultiSelect
    v-else-if="field.type === FIELD_TYPE_MULTI_SELECT"
    ref="multiSelectRef"
    v-model="local"
    size="small"
    filter
    filterName="name"
    :options="choices"
    optionLabel="name"
    optionValue="id"
    class="w-full h-full !absolute left-0 top-0 !rounded-none"
    display="chip"
    panelClass="cell-editor-overlay"
    @show="onOverlayShow"
  >
    <template #value="slotProps">
      <div class="flex flex-wrap gap-1 items-center h-full overflow-hidden content-center">
        <template v-if="slotProps.value && slotProps.value.length">
          <span 
            v-for="val in slotProps.value"
            :key="val" 
            class="inline-flex items-center px-1.5 py-0.5 rounded-xl bg-[#f1f5f9] text-[#1e293b] text-sm max-w-[100px] truncate h-5 border border-[#e2e8f0]"
          >
            {{ choices.find((c: any) => c.id === val)?.name || val }}
          </span>
        </template>
        <template v-else>
          <span class="text-slate-400 h-3 text-sm">{{ slotProps.placeholder || '查找选项' }}</span>
        </template>
      </div>
    </template>
  </MultiSelect>

  <div
    v-else-if="field.type === FIELD_TYPE_CHECKBOX" 
    class="w-full h-full flex items-center justify-center bg-white !absolute left-0 top-0 !rounded-none"
  >
    <Checkbox v-model="local" :binary="true" />
  </div>

  <div 
    ref="fileTrigger"
    v-else-if="field.type === FIELD_TYPE_URL" 
    class="w-full h-full !absolute left-0 top-0 !rounded-none group bg-white flex items-center px-2"
  >
    <div v-if="local && local.link" class="flex items-center gap-1 w-full overflow-hidden">
      <a 
        :href="local.link" 
        target="_blank"
        class="text-blue-500 hover:text-blue-700 truncate"
        @click.stop
      >
        {{ local.text || local.link }}
      </a>
    </div>
    <div v-else class="text-slate-400 text-sm">请输入链接</div>

    <!-- URL Editor Popup -->
    <Teleport to="body">
      <div 
        v-if="urlEditorVisible"
        class="cell-editor-overlay fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-4 flex flex-col gap-3 w-[300px]"
        :style="urlPopupStyle"
        @mousedown.stop
        @click.stop
      >
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">文本</label>
          <InputText v-model="urlForm.text" size="small" placeholder="可选" />
        </div>
        
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">超链接</label>
          <InputText 
            v-model="urlForm.link" 
            size="small" 
            placeholder="https://example.com" 
            :class="{ 'p-invalid': urlError }"
            @input="validateUrlForm"
          />
          <small v-if="urlError" class="text-red-500 text-xs">无效的链接</small>
        </div>

        <div class="flex justify-end gap-2 mt-1">
          <Button label="取消" size="small" text @click="closeUrlEditor" severity="secondary" />
          <Button label="确定" size="small" @click="saveUrl" :disabled="urlError" />
        </div>
      </div>
    </Teleport>
  </div>

  <div 
    v-else-if="field.type === FIELD_TYPE_ATTACHMENT" 
    ref="attachmentTrigger"
    class="w-full h-full absolute left-0 top-0 bg-white flex items-center px-2 gap-2 overflow-hidden"
  >
    <!-- Cell Content: Simple summary or horizontal list -->
    <div class="flex-1 flex items-center gap-1 overflow-hidden">
      <i class="pi pi-paperclip text-slate-400 text-sm"></i>
      <span class="text-xs text-slate-600 truncate">
        {{ local?.length ? `${local.length} 个附件` : '暂无附件' }}
      </span>
    </div>
    <i class="pi pi-chevron-down text-slate-400 text-xs"></i>

    <!-- Popup Panel (Teleported to body) -->
    <Teleport to="body">
      <div
        v-if="attachmentPopupVisible"
        ref="attachmentPopup"
        class="cell-editor-overlay attachment-popup fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-3 w-[410px]"
        :style="popupStyle"
        @mousedown.stop
        @click.stop
      >
        <!-- File Grid -->
        <div v-if="local && local.length" class="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          <div 
            v-for="(file, index) in local" 
            :key="index"
            class="group relative aspect-video bg-slate-100 rounded border flex items-center justify-center overflow-hidden"
          >
            <!-- Preview -->
            <img 
              v-if="isImage(file)" 
              :src="file.url" 
              class="w-full h-full object-cover" 
            />
            <div v-else class="flex flex-col items-center justify-center gap-1 p-2 text-slate-400">
               <i :class="['pi text-2xl', getFileIcon(file)]"></i>
               <span class="text-[10px] truncate max-w-full px-1">{{ file.type.split('/')[1] || 'FILE' }}</span>
            </div>
    
            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-1.5">
              <!-- Top Row: Name + Delete -->
              <div class="flex items-start justify-between gap-1">
                <span class="text-white text-[10px] truncate flex-1 font-medium" :title="file.name">
                  {{ file.name }}
                </span>
                <i 
                  class="pi pi-times text-xs text-white/70 hover:text-red-400 cursor-pointer transition-colors"
                  @click.stop="removeFile(Number(index))"
                  v-tooltip="'删除'"
                ></i>
              </div>
    
              <!-- Center Row: Actions -->
              <div class="flex items-center justify-center gap-3">
                 <a 
                   :href="file.url" 
                   target="_blank"
                   class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center cursor-pointer transition-colors text-white"
                   v-tooltip="'查看'"
                 >
                   <i class="pi pi-eye text-xs"></i>
                 </a>
                 <div 
                   class="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center cursor-pointer transition-colors text-white"
                   @click.stop="downloadFile(file)"
                   v-tooltip="'下载'"
                 >
                   <i class="pi pi-download text-xs"></i>
                 </div>
              </div>
              
              <!-- Spacer for bottom balance -->
              <div class="h-3"></div>
            </div>
          </div>
        </div>
    
        <!-- Empty State -->
        <div v-else class="text-center py-4 text-slate-400 text-sm">
          暂无附件，请上传
        </div>
    
        <!-- Upload Button -->
        <label 
          class="flex items-center justify-center gap-2 w-full py-2 border border-dashed rounded-md cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-colors text-slate-500 hover:text-blue-500"
          :class="{ 'opacity-50 cursor-not-allowed': isUploading }"
        >
          <input 
            type="file" 
            multiple 
            class="hidden" 
            @change="handleFileUpload" 
            :disabled="isUploading"
            accept="*"
          >
          <i v-if="isUploading" class="pi pi-spin pi-spinner"></i>
          <i v-else class="pi pi-plus"></i>
          <span class="text-sm font-medium">添加本地文件</span>
        </label>
        
        <!-- Error Message -->
        <div 
          v-if="uploadError" 
          class="text-red-500 text-xs px-1"
        >
          {{ uploadError }}
        </div>
      </div>
    </Teleport>
  </div>

  <span v-else class="text-slate-400">(未实现)</span>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import type { Field, RecordRow, Attachment } from '../stores/work';
import {
  FIELD_TYPE_TEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_DATE,
  FIELD_TYPE_SINGLE_SELECT,
  FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_USER,
  FIELD_TYPE_GROUP,
  FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_CHECKBOX,
  FIELD_TYPE_URL,
  FIELD_TYPE_FORMULA,
  FIELD_TYPE_LOOKUP,
  FIELD_TYPE_WORKFLOW,
  FIELD_TYPE_BUTTON,
  dateFormatOptions,
  numberFormatOptions,
  formatDate
} from '../constants/table';
import { uploadFile } from '../api';
import { isImage, getFileIcon } from '../utils/field';
import { downloadFile } from '../utils/download';

const props = defineProps<{
  field: Field;
  record: RecordRow;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { recordId: string; revision: number; fieldId: string; type: string; value: any }): void;
}>();

const dropdownRef = ref();
const multiSelectRef = ref();
const fileTrigger = ref<HTMLElement | null>(null);
const attachmentPopupVisible = ref(false);
const attachmentTrigger = ref<HTMLElement | null>(null);
const popupStyle = ref({});

onMounted(() => {
  if (props.field.type === FIELD_TYPE_SINGLE_SELECT) {
    nextTick(() => {
      dropdownRef.value?.show();
    });
  } else if (props.field.type === FIELD_TYPE_MULTI_SELECT) {
    nextTick(() => {
      multiSelectRef.value?.show();
    });
  } else if (props.field.type === FIELD_TYPE_ATTACHMENT) {
    attachmentPopupVisible.value = true;
    nextTick(() => {
      updatePopupPosition();
      // Add resize/scroll listeners if needed, but for now simple positioning
    });
  } else if (props.field.type === FIELD_TYPE_URL) {
    urlEditorVisible.value = true;
    nextTick(() => {
      openUrlEditor();
    });
  }
});

function updatePopupPosition() {
  const trigger = attachmentTrigger.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  
  // Basic positioning: below the cell, aligned left
  popupStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  };
}

const fieldId = computed(() => props.field.id);

// PrimeVue 的 Calendar (DatePicker) 使用了一套基于 jQuery UI Datepicker 的老式格式字符串（例如 yy 代表 4 位年份）
// https://primevue.org/datepicker/#format
const calendarDateFormat = computed(() => {
  const fmt = props.field.options?.format;
  if (!fmt) return 'yy-mm-dd';
  // Extract date part (everything before the first space)
  const datePart = fmt.split(' ')[0];
  // Convert standard format (YYYY/MM/DD) to PrimeVue format (yy/mm/dd)
  return datePart
    .replace('YYYY', 'yy')
    .replace('MM', 'mm')
    .replace('DD', 'dd');
});
const calendarShowTime = computed(() => {
  const fmt = props.field.options?.format;
  return fmt ? fmt.includes('HH:mm') : false;
});

const numberFieldProps = computed(() => {
  const fmt = props.field.options?.format;
  if (!fmt || fmt === 'integer') {
    return { minFractionDigits: 0, maxFractionDigits: 0, useGrouping: false };
  }
  if (fmt === 'thousands') {
    return { minFractionDigits: 0, maxFractionDigits: 0, useGrouping: true };
  }
  if (fmt === 'thousands-decimal') {
    return { useGrouping: true };
  }
  if (fmt === 'percent') {
    return { suffix: '%' }; // Note: PrimeVue might treat input 50 as 50%, not 0.5. Depends on implementation.
  }
  if (fmt === 'percent-decimal') {
    return { suffix: '%', minFractionDigits: 2 }; 
  }
  if (fmt.startsWith('decimal-')) {
    const digits = parseInt(fmt.split('-')[1], 10);
    return { minFractionDigits: digits, maxFractionDigits: digits, useGrouping: false };
  }
  return {};
});

function normalizeLocalValue(value: any) {
  if (props.field.type === FIELD_TYPE_MULTI_SELECT) {
    return Array.isArray(value) ? value : [];
  }
  if (props.field.type === FIELD_TYPE_DATE) {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (props.field.type === FIELD_TYPE_NUMBER) {
    // If it's a number, we might want to ensure it respects decimal places or other formats
    // But usually for editing, we just return the raw number or string representation
    if (value === null || value === undefined || value === '') return null;
    return Number(value);
  }
  if (props.field.type === FIELD_TYPE_CHECKBOX) {
    return !!value;
  }
  if (props.field.type === FIELD_TYPE_ATTACHMENT) {
    return Array.isArray(value) ? JSON.parse(JSON.stringify(value)) : [];
  }
  if (props.field.type === FIELD_TYPE_URL) {
    // Ensure URL data is always normalized to object format { text, link }
    if (value && typeof value === 'string') {
      return { text: value, link: value };
    }
    if (value && typeof value === 'object' && !value.link) {
      return null;
    }
    return value;
  }

  return value;
}

const local = ref<any>(normalizeLocalValue(props.record.data?.[fieldId.value]));

// --- URL Logic ---
const urlError = ref(false);
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

// --- URL Editor Logic ---
const urlEditorVisible = ref(false);
const urlPopupStyle = ref({});
const urlForm = ref({ text: '', link: '' });

function validateUrlForm() {
  if (!urlForm.value.link) {
    urlError.value = false;
    return;
  }
  urlError.value = !URL_REGEX.test(urlForm.value.link.trim());
}

function openUrlEditor() {
  const target = fileTrigger.value;
  if (!target) return;
  
  // Initialize form
  const val = local.value;
  if (typeof val === 'object' && val !== null) {
    urlForm.value = { text: val.text || '', link: val.link || '' };
  } else if (typeof val === 'string') {
    urlForm.value = { text: '', link: val };
  } else {
    urlForm.value = { text: '', link: '' };
  }

  urlError.value = false;

  // Position
  const rect = target.getBoundingClientRect();
  urlPopupStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  };
}

function closeUrlEditor() {
  urlEditorVisible.value = false;
}

function saveUrl() {
  let link = urlForm.value.link.trim();
  const text = urlForm.value.text.trim();
  
  if (!link) {
    local.value = null;
    closeUrlEditor();
    return;
  }

  // Auto-complete protocol
  if (!/^https?:\/\//i.test(link)) {
    link = 'https://' + link;
  }

  // Always save as object structure
  local.value = {
    link, 
    text: text || link // If text is empty, use link as text
  };
  
  closeUrlEditor();
}

// --- Attachment Logic ---
const isUploading = ref(false);
const uploadError = ref('');

function removeFile(index: number) {
  if (Array.isArray(local.value)) {
    local.value.splice(index, 1);
  }
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  isUploading.value = true;
  uploadError.value = '';

  const maxSizeMB = Number(import.meta.env.VITE_UPLOAD_MAX_SIZE_MB) || 5;
  const MAX_SIZE = maxSizeMB * 1024 * 1024;
  const newFiles: Attachment[] = [];

  try {
    for (const file of Array.from(input.files)) {
      // Validation
      if (file.size > MAX_SIZE) {
        uploadError.value = `文件 ${file.name} 超过 ${maxSizeMB}MB 限制`;
        continue;
      }
      
      try {
        const uploaded = await uploadFile(file);
        newFiles.push({
          name: uploaded.name,
          type: uploaded.type,
          size: uploaded.size,
          url: uploaded.url,
          lastModified: file.lastModified
        });
      } catch (err) {
        console.error('File upload failed', err);
        uploadError.value = `文件 ${file.name} 上传失败`;
      }
    }

    if (newFiles.length > 0) {
      if (!Array.isArray(local.value)) {
        local.value = [];
      }
      local.value.push(...newFiles);
    }
  } catch (e) {
    console.error(e);
    uploadError.value = '上传过程中发生错误';
  } finally {
    isUploading.value = false;
    input.value = ''; // Reset input
  }
}

const choices = computed(() => props.field.options?.options ?? []);

function commit() {
  let v = local.value;

  // handle Number type
  if (props.field.type === FIELD_TYPE_NUMBER) {
    const num = v === '' || v === null || v === undefined ? null : Number(v);
    v = Number.isFinite(num) ? num : null;
  }
  
  // Handle URL type: if invalid, save as null
  if (props.field.type === FIELD_TYPE_URL && urlError.value) {
    v = null;
  }

  emit('update', {
    recordId: props.record.id,
    revision: props.record.revision,
    fieldId: fieldId.value,
    type: props.field.type,
    value: v
  });
}

// Hack: When overlay is shown, attach stopPropagation listener to it
// to prevent DataTable from detecting outside click and closing the editor
const stopProp = (e: Event) => {
  e.stopPropagation();
};

function onOverlayShow() {
  window.setTimeout(() => {
    const overlays = document.querySelectorAll('.cell-editor-overlay');
    overlays.forEach((overlay: any) => {
      // Add listeners
      overlay.addEventListener('mousedown', stopProp);
      overlay.addEventListener('mouseup', stopProp);
      overlay.addEventListener('click', stopProp);
    });
  }, 0);
}

onUnmounted(() => {
  // Submit current value when component is unloaded
  commit()

  const overlays = document.querySelectorAll('.cell-editor-overlay');
  overlays.forEach(overlay => {
    overlay.removeEventListener('mousedown', stopProp);
    overlay.removeEventListener('mouseup', stopProp);
    overlay.removeEventListener('click', stopProp);
  });
})
</script>

<style scoped>
.cell-textarea {
  display: block;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
  resize: none;
  font-size: 14px;
  padding: 0;
  border-radius: 0;
}

.cell-textarea::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.cell-textarea::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.6);
  border-radius: 9999px;
}

.cell-textarea::-webkit-scrollbar-track {
  background: transparent;
}
</style>
