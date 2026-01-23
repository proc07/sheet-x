/**
 * Common class name for editor overlays to identify them
 */
export const EDITOR_OVERLAY_CLASS = 'cell-editor-overlay';

/**
 * Attaches stopPropagation listeners to overlay elements to prevent
 * outside click detection from closing the editor prematurely.
 */
export function setupOverlayPropagation() {
  window.setTimeout(() => {
    const overlays = document.querySelectorAll(`.${EDITOR_OVERLAY_CLASS}`);
    overlays.forEach((overlay: any) => {
      overlay.addEventListener('mousedown', stopPropagation);
      overlay.addEventListener('mouseup', stopPropagation);
      overlay.addEventListener('click', stopPropagation);
    });
  }, 0);
  // why don't remove event listener?
  // Weak reference/GC: An event listener bound to a DOM element that automatically reclaims memory if the DOM element is removed and there is no JavaScript reference pointing to it,
  // eliminating the need to manually unbind it like a global window listener.
}

function stopPropagation(e: Event) {
  e.stopPropagation();
}
