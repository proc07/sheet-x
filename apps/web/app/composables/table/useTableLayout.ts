import { normalizeRowHeight } from '~/utils/helpers'
import { HEIGHT_PER_ROW, ROW_PADDING } from '~/constants/table'

export function useTableLayout() {
  const rowHeight = ref(1)
  const tableContainerRef = ref<HTMLElement | null>(null)
  const isScrolledRight = ref(false)
  const tableHeight = ref(600)

  const rowSize = computed(() => ROW_PADDING + rowHeight.value * HEIGHT_PER_ROW)

  function setRowHeight(value: number) {
    rowHeight.value = normalizeRowHeight(value)
  }

  function updateTableHeight() {
    if (!tableContainerRef.value) return
    const rect = tableContainerRef.value.getBoundingClientRect()
    const available = window.innerHeight - rect.top - 48
    tableHeight.value = Math.max(300, available)
  }

  function onHorizontalScroll(event: Event) {
    const target = event.target as HTMLElement
    isScrolledRight.value = target.scrollLeft > 0
  }

  onMounted(() => {
    updateTableHeight()
    window.addEventListener('resize', updateTableHeight)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateTableHeight)
  })

  return {
    rowHeight,
    rowSize,
    tableContainerRef,
    tableHeight,
    isScrolledRight,
    setRowHeight,
    updateTableHeight,
    onHorizontalScroll
  }
}
