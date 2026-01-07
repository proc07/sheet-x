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
      >
        <i :class="item.icon" class="text-base"></i>
        <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        <button
          v-if="item.children && !collapsed"
          type="button"
          class="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100"
          @click.stop="toggle(item.id)"
        >
          <i :class="isExpanded(item.id) ? 'pi pi-angle-down' : 'pi pi-angle-right'"></i>
        </button>
      </component>

      <div
        v-if="item.children && isExpanded(item.id) && !collapsed"
        class="mt-1 ml-3 border-l border-slate-200/70 pl-2"
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
</template>

<script setup lang="ts">
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
  if (active) return `${compact} bg-slate-900/5 text-slate-900`;
  return `${compact} text-slate-600 hover:bg-slate-100`;
}
</script>
