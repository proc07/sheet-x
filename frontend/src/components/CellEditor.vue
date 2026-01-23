<template>
  <component
    :is="editorComponent"
    v-model="local"
    :field="field"
    @commit="commit"
  />
  
  <span v-if="!editorComponent" class="text-slate-400 px-2 flex items-center h-full text-sm">(未实现)</span>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import type { Field, RecordRow } from '../stores/work';
import {
  FIELD_TYPE_TEXT,
  FIELD_TYPE_NUMBER,
  FIELD_TYPE_DATE,
  FIELD_TYPE_SINGLE_SELECT,
  FIELD_TYPE_MULTI_SELECT,
  FIELD_TYPE_ATTACHMENT,
  FIELD_TYPE_CHECKBOX,
  FIELD_TYPE_URL,
} from '../constants/table';
import { cloneDeep } from '../utils/deepClone';

// Dynamic Editors
import TextEditor from './cell-editors/Text.vue';
import NumberEditor from './cell-editors/Number.vue';
import DateEditor from './cell-editors/Date.vue';
import SingleSelectEditor from './cell-editors/SingleSelect.vue';
import MultiSelectEditor from './cell-editors/MultiSelect.vue';
import CheckboxEditor from './cell-editors/Checkbox.vue';
import UrlEditor from './cell-editors/Url.vue';
import AttachmentEditor from './cell-editors/Attachment.vue';

const props = defineProps<{
  field: Field;
  record: RecordRow;
}>();

const emit = defineEmits<{
  (e: 'update', payload: { recordId: string; revision: number; fieldId: string; type: string; value: any }): void;
}>();

const fieldId = computed(() => props.field.id);

const local = ref<any>(cloneDeep(props.record.data?.[fieldId.value]));

const editorComponent = computed(() => {
  switch (props.field.type) {
    case FIELD_TYPE_TEXT: return TextEditor;
    case FIELD_TYPE_NUMBER: return NumberEditor;
    case FIELD_TYPE_DATE: return DateEditor;
    case FIELD_TYPE_SINGLE_SELECT: return SingleSelectEditor;
    case FIELD_TYPE_MULTI_SELECT: return MultiSelectEditor;
    case FIELD_TYPE_CHECKBOX: return CheckboxEditor;
    case FIELD_TYPE_URL: return UrlEditor;
    case FIELD_TYPE_ATTACHMENT: return AttachmentEditor;
    default: return null;
  }
});

function commit() {
  emit('update', {
    recordId: props.record.id,
    revision: props.record.revision,
    fieldId: fieldId.value,
    type: props.field.type,
    value: local.value
  });
}
</script>