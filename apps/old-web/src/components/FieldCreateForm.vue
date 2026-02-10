<template>
  <div class="w-full space-y-4 text-slate-700">
    <!-- Title -->
    <div class="space-y-2">
      <div class="text-sm text-slate-500">标题</div>
      <InputText v-model="localName" placeholder="请输入字段标题" class="w-full" size="small" />
    </div>

    <!-- Type -->
    <div class="space-y-2">
      <div class="text-sm text-slate-500">字段类型</div>
      <Select
        v-model="localType"
        :options="fieldTypeOptions"
        optionLabel="label"
        optionValue="value"
        optionGroupLabel="label"
        optionGroupChildren="items"
        filter
        placeholder="选择字段类型"
        class="w-full"
        size="small"
        appendTo="body"
        scrollHeight="300px"
        @change="handleTypeChange"
      >
        <template #optiongroup="slotProps">
          <div class="text-sm font-bold text-slate-500">{{ slotProps.option.label }}</div>
        </template>
        <template #option="slotProps">
          <div class="flex items-center gap-2 text-sm">
            <i class="pi" :class="slotProps.option.icon"></i>
            <div>{{ slotProps.option.label }}</div>
          </div>
        </template>
        <template #value="slotProps">
          <div v-if="slotProps.value" class="flex items-center gap-2 text-sm">
            <i class="pi" :class="getFieldTypeIcon(slotProps.value)"></i>
            <div>{{ getFieldTypeLabel(slotProps.value) }}</div>
          </div>
          <span v-else>
            {{ slotProps.placeholder }}
          </span>
        </template>
      </Select>
    </div>

    <!-- Configuration Areas based on Type -->

    <!-- 1. Single/Multi Select Options -->
    <div v-if="isSelectType" class="space-y-2 border-t border-b border-slate-100 py-3">
      <div class="flex items-center justify-between">
        <div class="text-sm text-slate-500">选项内容</div>
        <div class="flex items-center gap-2">
          <Checkbox v-model="selectConfig.useQuote" binary inputId="useQuote" size="small" />
          <label for="useQuote" class="text-xs text-slate-500 cursor-pointer">引用选项</label>
        </div>
      </div>

      <div class="space-y-1 max-h-40 overflow-y-auto bg-slate-50 rounded-md px-3 py-3">
        <div v-for="opt in selectConfig.options" :key="opt.id" class="flex items-center gap-1 group">
          <div class="mr-2 cursor-move text-slate-300 hover:text-slate-500"><i class="pi pi-bars text-xs"></i></div>
          <InputText v-model="opt.name"  size="small" class="flex-1 h-7 border-none shadow-none focus:ring-0 px-1" placeholder="请输入选项名" />
          <Button icon="pi pi-times" text rounded size="small" class="w-6 h-6 !text-slate-300" @click="removeOption(opt.id)" />
        </div>
        <Button label="添加选项" icon="pi pi-plus" text size="small" class="w-full justify-start px-1 !text-blue-500" @click="addOption" />
      </div>
    </div>

    <!-- 2. User Config -->
    <div v-if="localType === FIELD_TYPE_USER" class="space-y-3 border-t border-b border-slate-100 py-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-600">允许添加多个成员</span>
        <ToggleSwitch v-model="userConfig.isMultiple" size="small" />
      </div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1">
             <span class="text-sm text-slate-600">获取更多信息</span>
             <i class="pi pi-info-circle text-xs text-slate-400" v-tooltip="'开启后可查看用户详细信息'"></i>
        </div>
        <ToggleSwitch v-model="userConfig.showMoreInfo" :disabled="userConfig.isMultiple" size="small" />
      </div>
    </div>

    <!-- 3. Date Config -->
    <div v-if="localType === FIELD_TYPE_DATE" class="space-y-2 border-t border-b border-slate-100 py-2">
        <div class="text-sm text-slate-500">日期格式</div>
        <Select v-model="dateConfig.format" :options="dateFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
    </div>

    <!-- 5. Number Config -->
    <div v-if="localType === FIELD_TYPE_NUMBER" class="space-y-2 border-t border-b border-slate-100 py-2">
        <div class="text-sm text-slate-500">数字格式</div>
        <Select v-model="numberConfig.format" :options="numberFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
    </div>

    <!-- 8. Formula Config -->
    <div v-if="localType === FIELD_TYPE_FORMULA" class="space-y-2 border-t border-b border-slate-100 py-2">
      <div class="text-sm text-slate-500">公式内容</div>
      <Textarea v-model="formulaConfig.expression" rows="3" class="w-full text-xs font-mono" placeholder="输入公式，如: {FieldA} + {FieldB}" />
      <div class="flex gap-2">
        <Button label="插入字段" size="small" text severity="secondary" @click="showFieldPicker = true" />
        <Button label="函数列表" size="small" text severity="secondary" />
      </div>
    </div>

    <!-- 9. Lookup Config -->
    <div v-if="localType === FIELD_TYPE_LOOKUP" class="space-y-3 border-t border-b border-slate-100 py-3">
      <!-- Reference Field -->
      <div class="space-y-1">
        <div class="text-sm text-slate-500">需要引用的字段</div>
        <div class="flex gap-2">
          <Select v-model="lookupConfig.targetTableId" :options="tables" optionLabel="name" optionValue="id" placeholder="引用字段所在的数据表" class="flex-1" size="small" appendTo="body" @change="lookupConfig.targetFieldId = ''" />
          <Select v-model="lookupConfig.targetFieldId" :options="availableTargetFields" optionLabel="name" optionValue="id" placeholder="选择引用字段" class="flex-1" size="small" appendTo="body" :disabled="!lookupConfig.targetTableId" />
        </div>
      </div>
      <!-- Filters -->
      <div class="space-y-1">
        <div class="text-sm text-slate-500">查找条件</div>
        <div v-for="(filter, idx) in lookupConfig.filters" :key="idx" class="flex items-center gap-2 mb-2">
          <Select v-model="filter.targetField" :options="availableTargetFields" optionLabel="name" optionValue="id" class="flex-[1.5]" size="small" appendTo="body" placeholder="引用表中的字段" />
          <div class="flex-1 min-w-[60px]">
            <Select v-model="filter.operator" :options="[{label:'等于', value:'='}]" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
          </div>
          <Select v-model="filter.currentField" :options="currentTableFields" optionLabel="name" optionValue="id" class="flex-[1.5]" size="small" appendTo="body" placeholder="当前表中的字段" />
          <i class="pi pi-trash text-slate-400 hover:text-red-500 cursor-pointer" @click="lookupConfig.filters.splice(idx, 1)"></i>
        </div>
        <div class="flex">
          <Button label="添加条件" icon="pi pi-plus" text size="small" class="px-0 text-slate-600 hover:text-blue-600" @click="lookupConfig.filters.push({targetField:'', operator: '=', currentField:''})" />
        </div>
      </div>
      <!-- Calculation & Format -->
      <div class="grid grid-cols-2 gap-2">
        <div class="space-y-1">
          <div class="text-sm text-slate-500">计算方式</div>
          <Select v-model="lookupConfig.calculationType" :options="calculationOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
        </div>
        <div class="space-y-1">
          <div class="text-sm text-slate-500">字段格式</div>
          <Select v-model="lookupConfig.format" :options="lookupFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
        </div>
      </div>
    </div>

    <!-- Default Value (Hidden for certain types) -->
    <div v-if="showDefaultValue" class="space-y-2">
      <div class="flex items-center gap-1">
        <div class="text-sm text-slate-500">默认值</div>
        <i class="pi pi-info-circle text-xs text-slate-400" v-tooltip.top="{ value: '新添加记录时，自动填充默认值', pt: { root: { class: 'w-60' }, text: { class: 'text-xs leading-relaxed' } } }"></i>
      </div>

      <!-- Text Default -->
      <InputText v-if="localType === FIELD_TYPE_TEXT" v-model="defaultValue" placeholder="请输入内容" class="w-full" size="small" />
      
      <!-- Select Default -->
      <Select v-else-if="localType === FIELD_TYPE_SINGLE_SELECT" v-model="defaultValue" :options="selectConfig.options" optionLabel="name" optionValue="id" placeholder="请选择默认值" class="w-full" size="small" appendTo="body" showClear />
      
      <MultiSelect v-else-if="localType === FIELD_TYPE_MULTI_SELECT" v-model="defaultValue" :options="selectConfig.options" optionLabel="name" optionValue="id" placeholder="请选择默认值" class="w-full" size="small" appendTo="body" display="chip" />

      <!-- User Default -->
      <component 
        v-else-if="localType === FIELD_TYPE_USER"
        :is="userConfig.isMultiple ? 'MultiSelect' : 'Select'"
        v-model="defaultValue"
        :options="mockUsers"
        optionLabel="name"
        optionValue="id"
        placeholder="请选择成员"
        class="w-full"
        size="small"
        appendTo="body"
        :filter="true"
      >
         <template #option="slotProps">
            <div class="flex items-center gap-2">
                <Avatar :image="slotProps.option.avatar" shape="circle" size="small" />
                <span>{{ slotProps.option.name }}</span>
            </div>
         </template>
      </component>

      <!-- Date Default -->
      <DatePicker v-else-if="localType === FIELD_TYPE_DATE" v-model="defaultValue" :showTime="dateConfig.format.includes('HH')" showIcon fluid iconDisplay="input" size="small" appendTo="body" />

      <!-- Number Default -->
      <InputNumber v-else-if="localType === FIELD_TYPE_NUMBER" v-model="defaultValue" class="w-full" size="small" :minFractionDigits="getNumberFraction(numberConfig.format)" />
    </div>

    <!-- Buttons -->
    <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-2">
      <Button label="取消" size="small" text severity="secondary" @click="$emit('cancel')" />
      <Button label="确定" size="small" @click="handleSubmit" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { fieldTypeOptions, fieldTypeMeta } from '../constants/table';
import { useWorkStore } from '../stores/work';
import type { Field, FieldType } from '../types/table';
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
  numberFormatOptions
} from '../constants/table';
import { nanoid } from 'nanoid';

// Components might be auto-imported, but defining props
const props = defineProps<{
  initialName?: string;
  initialType?: string;
  initialOptions?: any;
  tableId?: string;
}>();

const emit = defineEmits(['submit', 'cancel', 'update:type']);
const work = useWorkStore();

const localName = ref(props.initialName || '');
const localType = ref<Field['type']>(props.initialType as Field['type'] || FIELD_TYPE_TEXT);
const defaultValue = ref<any>(null);
  
// Type Config State
const selectConfig = ref({
  useQuote: false,
  options: [
    { id: nanoid(6), name: '选项1' },
    { id: nanoid(6), name: '选项2' }
  ]
});

const userConfig = ref({
  isMultiple: false,
  showMoreInfo: false
});

const dateConfig = ref({
  format: 'YYYY/MM/DD'
});

const numberConfig = ref({
  format: 'integer'
});

const formulaConfig = ref({
  expression: ''
});

const showFieldPicker = ref(false);

const lookupConfig = ref({
  targetTableId: '',
  targetFieldId: '',
  filters: [] as { targetField: string, operator: string, currentField: string }[],
  calculationType: 'ORIGINAL',
  format: FIELD_TYPE_TEXT
});

function initFromOptions() {
  localName.value = props.initialName || '';
  localType.value = (props.initialType as Field['type']) || FIELD_TYPE_TEXT;
  
  const opts = props.initialOptions || {};
  defaultValue.value = opts.defaultValue ?? null;

  // Initialize configs based on options
  if (opts.options && Array.isArray(opts.options)) {
    selectConfig.value.options = opts.options;
  }
  if (opts.useQuote !== undefined) selectConfig.value.useQuote = opts.useQuote;

  if (opts.isMultiple !== undefined) userConfig.value.isMultiple = opts.isMultiple;
  if (opts.showMoreInfo !== undefined) userConfig.value.showMoreInfo = opts.showMoreInfo;

  if (opts.format) {
    dateConfig.value.format = opts.format;
    numberConfig.value.format = opts.format;
    lookupConfig.value.format = opts.format; // Re-use format for lookup if applicable, though lookup usually has its own structure
  }
  
  if (opts.expression) formulaConfig.value.expression = opts.expression;

  if (opts.targetTableId) lookupConfig.value.targetTableId = opts.targetTableId;
  if (opts.targetFieldId) lookupConfig.value.targetFieldId = opts.targetFieldId;
  if (opts.filters) lookupConfig.value.filters = opts.filters;
  if (opts.calculationType) lookupConfig.value.calculationType = opts.calculationType;

  // Safe guard for defaultValue type mismatch
  if (localType.value === FIELD_TYPE_NUMBER && typeof defaultValue.value === 'string') {
    const num = Number(defaultValue.value);
    defaultValue.value = Number.isFinite(num) ? num : null;
  } else if (localType.value === FIELD_TYPE_DATE && typeof defaultValue.value === 'string') {
    const d = new Date(defaultValue.value);
    if (!isNaN(d.getTime())) {
      defaultValue.value = d;
    } else {
      defaultValue.value = null;
    }
  }
}

watch(() => props.initialName, () => {
  initFromOptions();
});
// When initialType changes, we should also reset/init
watch(() => props.initialType, (newVal) => {
  // If we are switching types via edit, we want to load options.
  // If we are just creating new, options might be empty.
  if (newVal) localType.value = newVal as Field['type'];
});
watch(() => props.initialOptions, () => {
  initFromOptions();
}, { deep: true });

onMounted(() => {
  initFromOptions();
});

watch(localType, (newType) => {
  emit('update:type', newType);
});

const calculationOptions = [
  { label: '原值', value: 'ORIGINAL' }
];

const lookupFormatOptions = [
  { label: 'A= 文本', value: FIELD_TYPE_TEXT }
];

// Computed Helpers
const isSelectType = computed(() => [FIELD_TYPE_SINGLE_SELECT, FIELD_TYPE_MULTI_SELECT].includes(localType.value));

const showDefaultValue = computed(() => {
  return ![FIELD_TYPE_ATTACHMENT, FIELD_TYPE_CHECKBOX, FIELD_TYPE_URL, FIELD_TYPE_FORMULA, FIELD_TYPE_LOOKUP, FIELD_TYPE_BUTTON, FIELD_TYPE_WORKFLOW].includes(localType.value);
});

// Mock Data
const mockUsers = [
  { id: 'u1', name: '张三', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png' },
  { id: 'u2', name: '李四', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png' },
  { id: 'u3', name: '王五', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png' }
];


const tables = computed(() => work.tables);
const availableTargetFields = computed(() => {
  if (!lookupConfig.value.targetTableId) return [];
  // Ideally fetch fields for target table. For now assuming loaded or empty.
  // In real app, we might need to await work.loadFields(targetTableId)
  // Here we can only show if they are already loaded in store (which holds current table fields usually)
  // If target table is same as current, use work.fields
  if (lookupConfig.value.targetTableId === props.tableId) return work.fields;
  return []; // MVP limitation: only current table lookup or need fetching
});

const currentTableFields = computed(() => work.fields);

// Methods
function getFieldTypeIcon(type: string) {
  return fieldTypeMeta[type as FieldType]?.icon;
}

function getFieldTypeLabel(type: string) {
  // simplified lookup
  return fieldTypeMeta[type as FieldType]?.label || type;
}

function handleTypeChange() {
  defaultValue.value = null;
  // Reset configs if needed
}

function addOption() {
  selectConfig.value.options.push({ id: nanoid(6), name: `新选项` });
}

function removeOption(id: string) {
  selectConfig.value.options = selectConfig.value.options.filter(opt => opt.id !== id);
  // Reset defaultValue if it's now invalid
  if (Array.isArray(defaultValue.value) && defaultValue.value.includes(id)) {
    defaultValue.value = defaultValue.value.filter((v: string) => v !== id);
  }
  if (typeof defaultValue.value === 'string' && defaultValue.value === id) {
    defaultValue.value = null;
  }
}

function getNumberFraction(format: string) {
  if (format === 'decimal-1') return 1;
  if (format === 'decimal-2') return 2;
  return 0;
}

function handleSubmit() {
  if (!localName.value.trim()) return;

  let options: any = {};

  switch (localType.value) {
    case FIELD_TYPE_SINGLE_SELECT:
    case FIELD_TYPE_MULTI_SELECT:
      options = { ...selectConfig.value };
      break;
    case FIELD_TYPE_USER:
      options = { ...userConfig.value };
      break;
    case FIELD_TYPE_DATE:
      options = { ...dateConfig.value };
      break;
    case FIELD_TYPE_NUMBER:
      options = { ...numberConfig.value };
      break;
    case FIELD_TYPE_FORMULA:
      options = { ...formulaConfig.value };
      break;
    case FIELD_TYPE_LOOKUP:
      options = { ...lookupConfig.value };
      break;
  }

  // Add defaultValue
  if (defaultValue.value !== null && defaultValue.value !== '') {
    options.defaultValue = defaultValue.value;
  }

  emit('submit', {
    name: localName.value,
    type: localType.value,
    options
  });
}
</script>

<style scoped>
/* Scrollbar tweaks */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 2px;
}
</style>
