export function calculateAvailableHeight(element: HTMLElement | EventTarget | null, minHeight = 200, offset = 20): string {
  const el = element as HTMLElement;
  if (!el || !el.getBoundingClientRect) return `${minHeight}px`;

  const rect = el.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  
  // Calculate space below the element
  const spaceBelow = viewportHeight - rect.bottom - offset;
  const height = Math.max(spaceBelow, minHeight);

  return `${height}px`;
}
