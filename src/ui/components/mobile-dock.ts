// src/ui/components/mobile-dock.ts
// Mobile dock interaction helpers.
// Live mobile dock content rendering is owned by `dock-renderers.ts`.

/**
 * Toggle mobile dock expanded/collapsed state
 */
export function toggleMobileDock(): void {
  const dock = document.getElementById('build-dock');
  const backdrop = document.getElementById('dock-backdrop');
  const mobileBar = document.getElementById('dock-mobile-bar');
  if (!dock) return;

  const isExpanded = dock.classList.toggle('dock-expanded');

  // Toggle backdrop
  if (backdrop) {
    if (isExpanded) {
      backdrop.classList.add('active');
    } else {
      backdrop.classList.remove('active');
    }
  }

  // Chevron rotation via class
  if (mobileBar) {
    mobileBar.classList.toggle('bar-expanded', isExpanded);
  }
}
