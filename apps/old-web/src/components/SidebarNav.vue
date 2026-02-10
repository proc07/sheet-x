<template>
  <div class="space-y-1">
    <div v-for="item in items" :key="item.id">
      <component
        :is="item.to ? 'router-link' : 'button'"
        :to="item.to"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition"
        :class="itemClass(item)"
        :title="collapsed ? item.label : undefined"
        @click="handleItemClick(item)"
        @mouseenter="onItemMouseEnter($event, item)"
      >
        <i :class="item.icon" class="text-base"></i>
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        <button
          v-if="item.children && !collapsed"
          type="button"
          class="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:text-slate-500 dark:hover:bg-slate-800"
          @click.stop="toggle(item.id)"
        >
          <i :class="isExpanded(item.id) ? 'pi pi-angle-down' : 'pi pi-angle-right'"></i>
        </button>
      </component>

      <div
        v-if="item.children && isExpanded(item.id) && !collapsed"
        class="mt-1 ml-3 border-l border-slate-200/70 pl-2 dark:border-slate-700/70"
      >
        <SidebarNav
          :items="item.children"
          :active-path="activePath"
          :collapsed="collapsed"
          :expanded-keys="expandedKeys"
          @toggle="toggle"
        />
      </div>
    </div>
  </div>

  <Menu ref="hoverMenu" :model="hoverMenuModel" :popup="true" />
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import Menu from 'primevue/menu';

defineOptions({ name: 'SidebarNav' });

type NavItem = {
  id: string;
  label: string;
  icon: string;
  to?: string;
  match?: (path: string) => boolean;
  children?: NavItem[];
};

const props = defineProps<{
  items: NavItem[];
  activePath: string;
  collapsed: boolean;
  expandedKeys: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'toggle', id: string): void;
}>();

const router = useRouter();
const hoverMenu = ref();
const hoverItem = ref<NavItem | null>(null);

const hoverMenuModel = computed(() => {
  if (!hoverItem.value) return [];
  const item = hoverItem.value;
  // If has children, show children. Otherwise show itself (e.g. for label tooltip purpose or single action)
  const source = item.children && item.children.length > 0 ? item.children : [item];
  
  return source.map(child => ({
    label: child.label,
    icon: child.icon,
    command: () => {
      if (child.to) {
        router.push(child.to);
      } else if (child.children) {
        // If clicking a parent in menu, maybe expand it? 
        // But here we just navigate or do nothing.
        emit('toggle', child.id);
      }
    }
  }));
});

function onItemMouseEnter(event: MouseEvent, item: NavItem) {
  if (!props.collapsed) return;
  
  hoverItem.value = item;
  const target = event.currentTarget as HTMLElement;
  
  // Show menu
  hoverMenu.value?.show(event);
  
  // Manually align to Right-Top
  nextTick(() => {
    const menuEl = hoverMenu.value?.container;
    if (menuEl && target) {
      const rect = target.getBoundingClientRect();
      menuEl.style.left = `${rect.right + 4}px`; // 4px gap
      menuEl.style.top = `${rect.top}px`;
    }
  });
}

function isExpanded(id: string) {
  return props.expandedKeys.has(id);
}

function toggle(id: string) {
  emit('toggle', id);
}

function handleItemClick(item: NavItem) {
  if (item.children && !item.to) {
    toggle(item.id);
  }
}

function itemClass(item: NavItem) {
  const active = item.match ? item.match(props.activePath) : item.to === props.activePath;
  const compact = props.collapsed ? 'justify-center px-2' : '';
  if (active) return `${compact} bg-slate-900/5 text-slate-900 dark:bg-slate-800/70 dark:text-slate-100`;
  return `${compact} text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60`;
}
</script>
