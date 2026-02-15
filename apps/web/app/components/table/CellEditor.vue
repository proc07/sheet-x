<script setup lang="ts">
import type { Field, Attachment, UrlData } from '~/types/table'
import {
  FIELD_TYPE_TEXT, FIELD_TYPE_NUMBER, FIELD_TYPE_DATE,
  FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_CHECKBOX, FIELD_TYPE_URL, FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_PHONE, FIELD_TYPE_EMAIL
} from '~/constants/table'
import { isImage, getFileIcon, downloadFile } from '~/utils/helpers'

const props = defineProps<{
  modelValue: any
  field: Field
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'commit': []
}>()

// ── Type checks ──────────────────────────────────────────────
const isTextLike = computed(() =>
  [FIELD_TYPE_TEXT, FIELD_TYPE_PHONE, FIELD_TYPE_EMAIL].includes(props.field.type as any)
)
const isNumber = computed(() => props.field.type === FIELD_TYPE_NUMBER)
const isDate = computed(() => props.field.type === FIELD_TYPE_DATE)
const isSingleSelect = computed(() => props.field.type === FIELD_TYPE_SINGLE_SELECT)
const isMultiSelect = computed(() => props.field.type === FIELD_TYPE_MULTI_SELECT)
const isCheckbox = computed(() => props.field.type === FIELD_TYPE_CHECKBOX)
const isUrl = computed(() => props.field.type === FIELD_TYPE_URL)
const isAttachment = computed(() => props.field.type === FIELD_TYPE_ATTACHMENT)

// ── Text / Number ────────────────────────────────────────────
const textValue = computed({
  get: () => (props.modelValue ?? '') as string,
  set: v => emit('update:modelValue', v)
})

const numberValue = computed({
  get: () => props.modelValue as number | undefined,
  set: v => emit('update:modelValue', v)
})

// ── Date ─────────────────────────────────────────────────────
const dateValue = computed({
  get: () => props.modelValue ? new Date(props.modelValue).toISOString().slice(0, 16) : '',
  set: (v) => {
    emit('update:modelValue', v ? new Date(v).toISOString() : null)
  }
})

// ── Select ───────────────────────────────────────────────────
const selectChoices = computed(() => {
  const opts = props.field.config?.options as Array<{ id: string, name: string }> ?? []
  return opts.map(o => ({ label: o.name, value: o.id }))
})

const singleSelectValue = computed({
  get: () => props.modelValue ?? undefined,
  set: (v) => {
    emit('update:modelValue', v)
    emit('commit')
  }
})

const multiSelectValue = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []) as string[],
  set: (v) => {
    emit('update:modelValue', v)
    emit('commit')
  }
})

// ── Checkbox ─────────────────────────────────────────────────
const checkboxValue = computed({
  get: () => !!props.modelValue,
  set: (v) => {
    emit('update:modelValue', v)
    emit('commit')
  }
})

// ── URL ──────────────────────────────────────────────────────
const urlForm = ref({ text: '', link: '' })
const urlError = ref(false)
const URL_REGEX = /^(https?:\/\/)?((([a-zA-Z\d]([a-zA-Z\d-]*[a-zA-Z\d])*)\.)+[a-zA-Z]{2,}|((\d{1,3}\.){3}\d{1,3})|localhost)(:\d+)?(\/[-a-zA-Z\d%_.~+]*)*(\\?[;&a-zA-Z\d%_.~+=-]*)?(#[-a-zA-Z\d_]*)?$/

watch(() => props.modelValue, (v) => {
  if (!v) {
    urlForm.value = { text: '', link: '' }
  }
  else if (typeof v === 'string') {
    urlForm.value = { text: '', link: v }
  }
  else {
    urlForm.value = { text: v.text || '', link: v.link || '' }
  }
}, { immediate: true })

function validateUrl() {
  if (!urlForm.value.link) { urlError.value = false; return }
  urlError.value = !URL_REGEX.test(urlForm.value.link.trim())
}

function saveUrl() {
  let link = urlForm.value.link.trim()
  const text = urlForm.value.text.trim()
  if (!link) {
    emit('update:modelValue', null)
    emit('commit')
    return
  }
  if (!/^https?:\/\//i.test(link)) link = `https://${link}`
  emit('update:modelValue', { link, text: text || link } as UrlData)
  emit('commit')
}

// ── Attachment ───────────────────────────────────────────────
const attachmentList = computed(() =>
  Array.isArray(props.modelValue) ? props.modelValue as Attachment[] : []
)
const isUploading = ref(false)
const uploadError = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

function triggerUpload() {
  fileInputRef.value?.click()
}

function removeAttachment(index: number) {
  const newList = [...attachmentList.value]
  newList.splice(index, 1)
  emit('update:modelValue', newList)
  emit('commit')
}

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return

  isUploading.value = true
  uploadError.value = ''
  const maxSizeMB = 5
  const MAX_SIZE = maxSizeMB * 1024 * 1024
  const newFiles: Attachment[] = []

  try {
    for (const file of Array.from(input.files)) {
      if (file.size > MAX_SIZE) {
        uploadError.value = `文件 ${file.name} 超过 ${maxSizeMB}MB 限制`
        continue
      }
      try {
        const formData = new FormData()
        formData.append('file', file)
        const uploaded = await $fetch<{ name: string, type: string, size: number, url: string }>('/api/upload', {
          method: 'POST',
          body: formData
        })
        newFiles.push({
          name: uploaded.name,
          type: uploaded.type,
          size: uploaded.size,
          url: uploaded.url,
          lastModified: file.lastModified
        })
      }
      catch {
        uploadError.value = `文件 ${file.name} 上传失败`
      }
    }
    if (newFiles.length > 0) {
      emit('update:modelValue', [...attachmentList.value, ...newFiles])
      emit('commit')
    }
  }
  finally {
    isUploading.value = false
    input.value = ''
  }
}

function onKeyEnter() {
  emit('commit')
}
</script>

<template>
  <!-- Text / Phone / Email -->
  <div v-if="isTextLike" class="w-full">
    <UTextarea
      v-model="textValue"
      autofocus
      :rows="2"
      class="w-full"
      @keydown.enter.prevent="onKeyEnter"
    />
  </div>

  <!-- Number -->
  <div v-else-if="isNumber" class="w-full">
    <UInput
      v-model.number="numberValue"
      type="number"
      autofocus
      class="w-full"
      @keydown.enter.prevent="onKeyEnter"
    />
  </div>

  <!-- Date -->
  <div v-else-if="isDate" class="w-full">
    <UInput
      v-model="dateValue"
      type="datetime-local"
      class="w-full"
      @change="emit('commit')"
    />
  </div>

  <!-- Single Select -->
  <div v-else-if="isSingleSelect" class="w-full">
    <USelectMenu
      v-model="singleSelectValue"
      :items="selectChoices"
      value-key="value"
      placeholder="选择..."
      class="w-full"
    />
  </div>

  <!-- Multi Select -->
  <div v-else-if="isMultiSelect" class="w-full">
    <USelectMenu
      v-model="multiSelectValue"
      :items="selectChoices"
      multiple
      value-key="value"
      placeholder="选择..."
      class="w-full"
    />
  </div>

  <!-- Checkbox -->
  <div v-else-if="isCheckbox" class="flex items-center p-2">
    <UCheckbox v-model="checkboxValue" />
  </div>

  <!-- URL -->
  <div v-else-if="isUrl" class="flex flex-col gap-2 p-3 min-w-[260px]">
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted">文本</label>
      <UInput v-model="urlForm.text" size="sm" placeholder="可选" />
    </div>
    <div class="flex flex-col gap-1">
      <label class="text-xs text-muted">超链接</label>
      <UInput
        v-model="urlForm.link"
        size="sm"
        placeholder="https://example.com"
        :color="urlError ? 'error' : undefined"
        @input="validateUrl"
      />
      <span v-if="urlError" class="text-xs text-error">无效的链接</span>
    </div>
    <div class="flex justify-end gap-2 mt-1">
      <UButton label="取消" size="xs" variant="ghost" color="neutral" @click="emit('commit')" />
      <UButton label="确定" size="xs" :disabled="urlError" @click="saveUrl" />
    </div>
  </div>

  <!-- Attachment -->
  <div v-else-if="isAttachment" class="flex flex-col gap-2 p-3 min-w-[360px]">
    <div v-if="attachmentList.length" class="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto">
      <div
        v-for="(file, idx) in attachmentList"
        :key="idx"
        class="group relative aspect-video bg-muted/30 rounded border border-default flex items-center justify-center overflow-hidden"
      >
        <img v-if="isImage(file)" :src="file.url" class="w-full h-full object-cover" :alt="file.name">
        <div v-else class="flex flex-col items-center gap-1 p-2 text-muted">
          <UIcon :name="getFileIcon(file)" class="size-6" />
          <span class="text-[10px] truncate max-w-full px-1">{{ file.type?.split('/')[1] || 'FILE' }}</span>
        </div>
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
          <div class="flex justify-between gap-1">
            <span class="text-white text-[10px] truncate flex-1 font-medium">{{ file.name }}</span>
            <UIcon name="i-lucide-x" class="size-3 text-white/70 hover:text-red-400 cursor-pointer" @click.stop="removeAttachment(idx)" />
          </div>
          <div class="flex items-center justify-center gap-3">
            <a :href="file.url" target="_blank" class="size-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white">
              <UIcon name="i-lucide-eye" class="size-3" />
            </a>
            <div class="size-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white cursor-pointer" @click.stop="downloadFile(file)">
              <UIcon name="i-lucide-download" class="size-3" />
            </div>
          </div>
          <div class="h-3" />
        </div>
      </div>
    </div>
    <div v-else class="text-center py-4 text-muted text-sm">
      暂无附件，请上传
    </div>

    <label
      class="flex items-center justify-center gap-2 w-full py-2 border border-dashed border-default rounded-md cursor-pointer hover:bg-muted/20 hover:border-primary transition-colors text-muted hover:text-primary"
      :class="{ 'opacity-50 cursor-not-allowed': isUploading }"
    >
      <input ref="fileInputRef" type="file" multiple class="hidden" :disabled="isUploading" @change="handleFileUpload">
      <UIcon :name="isUploading ? 'i-lucide-loader-2' : 'i-lucide-plus'" class="size-4" :class="{ 'animate-spin': isUploading }" />
      <span class="text-sm font-medium">添加本地文件</span>
    </label>
    <div v-if="uploadError" class="text-error text-xs">
      {{ uploadError }}
    </div>
  </div>

  <!-- Fallback -->
  <div v-else class="w-full">
    <UInput
      v-model="textValue"
      autofocus
      class="w-full"
      @keydown.enter.prevent="onKeyEnter"
    />
  </div>
</template>
