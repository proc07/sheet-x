<template>
  <div 
    ref="triggerRef"
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
        v-if="popupVisible"
        class="attachment-popup fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-3 flex flex-col gap-3 w-[410px]"
        :class="EDITOR_OVERLAY_CLASS"
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
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import type { Attachment } from '../../types/table';
import { uploadFile } from '../../services/upload';
import { isImage, getFileIcon } from '../../utils/field';
import { downloadFile } from '../../utils/download';
import { EDITOR_OVERLAY_CLASS } from '../../utils/overlay';

const props = defineProps<{
  modelValue: Attachment[] | null | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Attachment[]): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: () => Array.isArray(props.modelValue) ? props.modelValue : [],
  set: (v) => emit('update:modelValue', v),
});

const triggerRef = ref<HTMLElement | null>(null);
const popupVisible = ref(false);
const popupStyle = ref({});
const isUploading = ref(false);
const uploadError = ref('');

onMounted(() => {
  popupVisible.value = true;
  nextTick(() => {
    updatePopupPosition();
  });
});

function updatePopupPosition() {
  const trigger = triggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  
  popupStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  };
}

function removeFile(index: number) {
  const newVal = [...local.value];
  newVal.splice(index, 1);
  local.value = newVal;
  emit('commit');
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
      local.value = [...local.value, ...newFiles];
      emit('commit');
    }
  } catch (e) {
    console.error(e);
    uploadError.value = '上传过程中发生错误';
  } finally {
    isUploading.value = false;
    input.value = ''; 
  }
}

</script>
