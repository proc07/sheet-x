<template>
  <div 
    ref="triggerRef"
    @click="editorVisible = true"
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
        v-if="editorVisible"
        class="fixed z-[9999] bg-white rounded-lg shadow-xl border border-slate-200 p-4 flex flex-col gap-3 w-[300px]"
        :class="EDITOR_OVERLAY_CLASS"
        :style="popupStyle"
        @mousedown.stop
        @click.stop
      >
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">文本</label>
          <InputText v-model="form.text" size="small" placeholder="可选" />
        </div>
        
        <div class="flex flex-col gap-1">
          <label class="text-xs text-slate-500">超链接</label>
          <InputText 
            v-model="form.link" 
            size="small" 
            placeholder="https://example.com" 
            :class="{ 'p-invalid': error }"
            @input="validateForm"
          />
          <small v-if="error" class="text-red-500 text-xs">无效的链接</small>
        </div>

        <div class="flex justify-end gap-2 mt-1">
          <Button label="取消" size="small" text @click="closeEditor" severity="secondary" />
          <Button label="确定" size="small" @click="save" :disabled="error" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, nextTick } from 'vue';
import { InputText, Button } from 'primevue';
import { EDITOR_OVERLAY_CLASS } from '../../utils/overlay';

interface UrlData {
  text?: string;
  link: string;
}

const props = defineProps<{
  modelValue: UrlData | string | null | undefined;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: UrlData | null): void;
  (e: 'commit'): void;
}>();

const local = computed({
  get: (): UrlData | null => {
    // Ensure URL data is always normalized to object format { text, link }
    const v = props.modelValue;

    if (v) {
      if (typeof v === 'string') {
        return { text: v, link: v };
      }
      if (typeof v === 'object') {
        return { text: v.text || '', link: v.link || '' };
      }
    }
    return { text: '', link: '' };
  },
  set: (v) => emit('update:modelValue', v),
});

const triggerRef = ref<HTMLElement | null>(null);
const editorVisible = ref(false);
const popupStyle = ref({});
const form = ref({ text: '', link: '' });
const error = ref(false);
// Standard URL regex that supports http/https, domain/IP, port, path, query params, and hash
// Based on a simplified version of RFC 3986
const URL_REGEX = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]*[a-zA-Z\d])*)\.)+[a-zA-Z]{2,}|((\d{1,3}\.){3}\d{1,3})|localhost)(:\d+)?(\/[-a-zA-Z\d%_.~+]*)*(\?[;&a-zA-Z\d%_.~+=-]*)?(#[-a-zA-Z\d_]*)?$/;

onMounted(() => {
  editorVisible.value = true;
  nextTick(() => {
    openEditor();
  });
});

function validateForm() {
  if (!form.value.link) {
    error.value = false;
    return;
  }
  error.value = !URL_REGEX.test(form.value.link.trim());
}

function openEditor() {
  const target = triggerRef.value;
  if (!target) return;
  
  // Initialize form
  const val = local.value;
  if (typeof val === 'object' && val !== null) {
    form.value = { text: val.text || '', link: val.link || '' };
  } else if (typeof val === 'string') {
    form.value = { text: '', link: val };
  } else {
    form.value = { text: '', link: '' };
  }

  error.value = false;

  // Position
  const rect = target.getBoundingClientRect();
  popupStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
  };
}

function closeEditor() {
  editorVisible.value = false;
}

function save() {
  let link = form.value.link.trim();
  const text = form.value.text.trim();
  
  if (!link) {
    local.value = null;
    closeEditor();
    return;
  }

  // Auto-complete protocol
  if (!/^https?:\/\//i.test(link)) {
    link = 'https://' + link;
  }

  local.value = {
    link, 
    text: text || link 
  };

  editorVisible.value = false;
  emit('commit');
}
</script>
