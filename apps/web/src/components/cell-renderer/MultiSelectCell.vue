<template>
  <div 
    ref="containerRef"
    class="flex flex-wrap gap-1 w-full content-start items-center"
    :style="{ height: `${rowHeight * HEIGHT_PER_ROW}px` }"
  >
    <span
      v-for="opt in visibleOptions" 
      :key="opt" 
      class="inline-flex items-center px-1.5 py-0.5 rounded-xl bg-blue-100 text-blue-700 text-sm max-w-full truncate h-6 border border-blue-200"
    >
      {{ getLabel(opt) }}
    </span>
    <span 
      v-if="hiddenCount > 0"
      class="inline-flex items-center px-1.5 py-0.5 rounded-xl bg-slate-100 text-slate-600 text-sm cursor-pointer shrink-0 h-6 border border-slate-200 hover:bg-slate-200 transition-colors" 
      v-tooltip.top="hiddenTooltip"
    >
      +{{ hiddenCount }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import type { Field } from '../../stores/work';
import { HEIGHT_PER_ROW } from '../../constants/table';

const props = defineProps<{
  value: any[];
  field: Field;
  rowHeight: number;
}>();

const containerRef = ref<HTMLElement | null>(null);
const containerWidth = ref(0);

// Update width on mount and resize
onMounted(() => {
  if (containerRef.value) {
    const ro = new ResizeObserver(entries => {
      for (let entry of entries) {
        containerWidth.value = entry.contentRect.width;
      }
    });
    ro.observe(containerRef.value);
  }
});

function getLabel(val: string) {
  const options = props.field.config?.options as Array<{ id: string; name: string }>;
  if (!options) return val;
  const opt = options.find(o => o.name === val || o.id === val);
  return opt ? opt.name : val;
}

// Estimate text width: simple heuristic
// Chinese ~12px, English ~7px, Padding+Border ~14px, Gap 4px
function estimateChipWidth(text: string) {
  let w = 14; 
  for (let i = 0; i < text.length; i++) {
    w += text.charCodeAt(i) > 255 ? 12 : 7;
  }
  return w;
}

const PLUS_N_WIDTH = 28; // Approximate width for "+99"

const visibleCount = computed(() => {
  if (!containerWidth.value) return 1; // Default to 1 if not measured yet

  const availableWidth = containerWidth.value;
  const maxLines = props.rowHeight;
  
  let currentLine = 1;
  let lineWidth = 0;
  let count = 0;
  
  for (let i = 0; i < props.value.length; i++) {
    const val = props.value[i];
    const label = getLabel(val);
    const w = estimateChipWidth(label) + 4; // +4 for gap

    // Check if adding this chip exceeds current line
    if (lineWidth + w > availableWidth) {
      // New line needed
      currentLine++;
      lineWidth = w;
    } else {
      lineWidth += w;
    }

    // If we exceeded max allowed lines
    if (currentLine > maxLines) {
      return Math.max(0, count); 
    }
    
    // Special check for last line: leave space for +N if there are more items remaining
    if (currentLine === maxLines && i < props.value.length - 1) {
       if (lineWidth + PLUS_N_WIDTH > availableWidth) {
         // Can't fit this AND the +N tag. So this one is the first hidden one.
         return count;
       }
    }
    
    count++;
  }
  
  return props.value.length;
});

const visibleOptions = computed(() => {
  return props.value.slice(0, visibleCount.value);
});

const hiddenCount = computed(() => {
  return props.value.length - visibleCount.value;
});

const hiddenTooltip = computed(() => {
  const hidden = props.value.slice(visibleCount.value);
  return hidden.map(v => getLabel(v)).join('\n');
});
</script>
