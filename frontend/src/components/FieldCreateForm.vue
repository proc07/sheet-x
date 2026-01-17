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
      <Dropdown
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
      </Dropdown>
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
        <div v-for="(opt, index) in selectConfig.options" :key="index" class="flex items-center gap-1 group">
          <div class="mr-2 cursor-move text-slate-300 hover:text-slate-500"><i class="pi pi-bars text-xs"></i></div>
          <InputText v-model="opt.name"  size="small" class="flex-1 h-7 border-none shadow-none focus:ring-0 px-1" placeholder="请输入选项名" />
          <Button icon="pi pi-times" text rounded size="small" class="w-6 h-6 !text-slate-300" @click="removeOption(index)" />
        </div>
        <Button label="添加选项" icon="pi pi-plus" text size="small" class="w-full justify-start px-1 !text-blue-500" @click="addOption" />
      </div>
    </div>

    <!-- 2. User Config -->
    <div v-if="localType === 'USER'" class="space-y-3 border-t border-b border-slate-100 py-2">
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
    <div v-if="localType === 'DATE'" class="space-y-2 border-t border-b border-slate-100 py-2">
        <div class="text-sm text-slate-500">日期格式</div>
        <Dropdown v-model="dateConfig.format" :options="dateFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
    </div>

    <!-- 5. Number Config -->
    <div v-if="localType === 'NUMBER'" class="space-y-2 border-t border-b border-slate-100 py-2">
        <div class="text-sm text-slate-500">数字格式</div>
        <Dropdown v-model="numberConfig.format" :options="numberFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
    </div>

    <!-- 8. Formula Config -->
    <div v-if="localType === 'FORMULA'" class="space-y-2 border-t border-b border-slate-100 py-2">
      <div class="text-sm text-slate-500">公式内容</div>
      <Textarea v-model="formulaConfig.expression" rows="3" class="w-full text-xs font-mono" placeholder="输入公式，如: {FieldA} + {FieldB}" />
      <div class="flex gap-2">
        <Button label="插入字段" size="small" text severity="secondary" @click="showFieldPicker = true" />
        <Button label="函数列表" size="small" text severity="secondary" />
      </div>
    </div>

    <!-- 9. Lookup Config -->
    <div v-if="localType === 'LOOKUP'" class="space-y-3 border-t border-b border-slate-100 py-3">
      <!-- Reference Field -->
      <div class="space-y-1">
        <div class="text-sm text-slate-500">需要引用的字段</div>
        <div class="flex gap-2">
          <Dropdown v-model="lookupConfig.targetTableId" :options="tables" optionLabel="name" optionValue="id" placeholder="引用字段所在的数据表" class="flex-1" size="small" appendTo="body" @change="lookupConfig.targetFieldId = ''" />
          <Dropdown v-model="lookupConfig.targetFieldId" :options="availableTargetFields" optionLabel="name" optionValue="id" placeholder="选择引用字段" class="flex-1" size="small" appendTo="body" :disabled="!lookupConfig.targetTableId" />
        </div>
      </div>
      <!-- Filters -->
      <div class="space-y-1">
        <div class="text-sm text-slate-500">查找条件</div>
        <div v-for="(filter, idx) in lookupConfig.filters" :key="idx" class="flex items-center gap-2 mb-2">
          <Dropdown v-model="filter.targetField" :options="availableTargetFields" optionLabel="name" optionValue="id" class="flex-[1.5]" size="small" appendTo="body" placeholder="引用表中的字段" />
          <div class="flex-1 min-w-[60px]">
            <Dropdown v-model="filter.operator" :options="[{label:'等于', value:'='}]" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
          </div>
          <Dropdown v-model="filter.currentField" :options="currentTableFields" optionLabel="name" optionValue="id" class="flex-[1.5]" size="small" appendTo="body" placeholder="当前表中的字段" />
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
          <Dropdown v-model="lookupConfig.calculationType" :options="calculationOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
        </div>
        <div class="space-y-1">
          <div class="text-sm text-slate-500">字段格式</div>
          <Dropdown v-model="lookupConfig.format" :options="lookupFormatOptions" optionLabel="label" optionValue="value" class="w-full" size="small" appendTo="body" />
        </div>
      </div>
    </div>

    <!-- Default Value (Hidden for certain types) -->
    <div v-if="showDefaultValue" class="space-y-2">
      <div class="flex items-center gap-1">
        <div class="text-sm text-slate-500">默认值</div>
        <i class="pi pi-info-circle text-xs text-slate-400"></i>
      </div>

      <!-- Text Default -->
      <InputText v-if="localType === 'TEXT'" v-model="defaultValue" placeholder="请输入内容" class="w-full" size="small" />
      
      <!-- Select Default -->
      <Dropdown v-else-if="localType === 'SINGLE_SELECT'" v-model="defaultValue" :options="selectConfig.options" optionLabel="name" optionValue="name" placeholder="请选择默认值" class="w-full" size="small" appendTo="body" showClear />
      
      <MultiSelect v-else-if="localType === 'MULTI_SELECT'" v-model="defaultValue" :options="selectConfig.options" optionLabel="name" optionValue="name" placeholder="请选择默认值" class="w-full" size="small" appendTo="body" display="chip" />

      <!-- User Default -->
      <component 
        v-else-if="localType === 'USER'"
        :is="userConfig.isMultiple ? 'MultiSelect' : 'Dropdown'"
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
      <DatePicker v-else-if="localType === 'DATE'" v-model="defaultValue" :showTime="dateConfig.format.includes('HH')" showIcon fluid iconDisplay="input" size="small" appendTo="body" />

      <!-- Number Default -->
      <InputNumber v-else-if="localType === 'NUMBER'" v-model="defaultValue" class="w-full" size="small" :minFractionDigits="getNumberFraction(numberConfig.format)" />
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
import type { Field } from '../stores/work';

// Components might be auto-imported, but defining props
const props = defineProps<{
  initialName?: string;
  initialType?: Field['type'];
  tableId?: string;
}>();

const emit = defineEmits(['submit', 'cancel']);
const work = useWorkStore();

const localName = ref(props.initialName || '');
const localType = ref<Field['type']>(props.initialType || 'TEXT');
const defaultValue = ref<any>(null);

// Type Config State
const selectConfig = ref({
  useQuote: false,
  options: [
    { name: '选项1' },
    { name: '选项2' }
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
  format: 'TEXT'
});

const calculationOptions = [
  { label: '原值', value: 'ORIGINAL' }
];

const lookupFormatOptions = [
  { label: 'A= 文本', value: 'TEXT' }
];

// Computed Helpers
const isSelectType = computed(() => ['SINGLE_SELECT', 'MULTI_SELECT'].includes(localType.value));

const showDefaultValue = computed(() => {
  return !['ATTACHMENT', 'CHECKBOX', 'URL', 'FORMULA', 'LOOKUP', 'BUTTON', 'WORKFLOW'].includes(localType.value);
});

// Mock Data
const mockUsers = [
  { id: 'u1', name: '张三', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/amyelsner.png' },
  { id: 'u2', name: '李四', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/asiyajavayant.png' },
  { id: 'u3', name: '王五', avatar: 'https://primefaces.org/cdn/primevue/images/avatar/onyamalimba.png' }
];

const dateFormatOptions = [
  { label: '2026/01/30', value: 'YYYY/MM/DD' },
  { label: '2026/01/30 14:00', value: 'YYYY/MM/DD HH:mm' },
  { label: '2026/01/30 14:00 (GMT+8)', value: 'YYYY/MM/DD HH:mm (z)' },
  { label: '2026-01-30', value: 'YYYY-MM-DD' },
  { label: '2026-01-30 14:00', value: 'YYYY-MM-DD HH:mm' },
  { label: '2026-01-30 14:00 (GMT+8)', value: 'YYYY-MM-DD HH:mm (z)' },
  { label: '01-30', value: 'MM-DD' },
  { label: '01/30/2026', value: 'MM/DD/YYYY' },
  { label: '30/01/2026', value: 'DD/MM/YYYY' }
];

const numberFormatOptions = [
  { label: '整数', value: 'integer' },
  { label: '千分位', value: 'thousands' },
  { label: '千分位 (小数点)', value: 'thousands-decimal' },
  { label: '保留 1 位小数', value: 'decimal-1' },
  { label: '保留 2 位小数', value: 'decimal-2' },
  { label: '保留 3 位小数', value: 'decimal-3' },
  { label: '保留 4 位小数', value: 'decimal-4' },
  { label: '保留 5 位小数', value: 'decimal-5' },
  { label: '保留 6 位小数', value: 'decimal-6' },
  { label: '保留 7 位小数', value: 'decimal-7' },
  { label: '保留 8 位小数', value: 'decimal-8' },
  { label: '保留 9 位小数', value: 'decimal-9' },
  { label: '百分比', value: 'percent' },
  { label: '百分比 (小数点)', value: 'percent-decimal' }
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
  return fieldTypeMeta[type as Field['type']]?.icon;
}

function getFieldTypeLabel(type: string) {
  // simplified lookup
  return fieldTypeMeta[type as Field['type']]?.label || type;
}

function handleTypeChange() {
  defaultValue.value = null;
  // Reset configs if needed
}

function addOption() {
  selectConfig.value.options.push({ name: `选项${selectConfig.value.options.length + 1}` });
}

function removeOption(index: number) {
  selectConfig.value.options.splice(index, 1);
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
    case 'SINGLE_SELECT':
    case 'MULTI_SELECT':
        options = { ...selectConfig.value };
        break;
    case 'USER':
        options = { ...userConfig.value };
        break;
    case 'DATE':
        options = { ...dateConfig.value };
        break;
    case 'NUMBER':
        options = { ...numberConfig.value };
        break;
    case 'FORMULA':
        options = { ...formulaConfig.value };
        break;
    case 'LOOKUP':
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
