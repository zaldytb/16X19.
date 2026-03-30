let heartbeatIntervalId: number | null = null;

function buildGridSvg(isActive: boolean): string {
  const cells: string[] = [];
  const activeIndex = 11;

  for (let index = 0; index < 16; index += 1) {
    const x = 2 + (index % 4) * 5;
    const y = 2 + Math.floor(index / 4) * 5;
    const fill = index === activeIndex
      ? (isActive ? '#FF4500' : '#6b7280')
      : 'rgba(107, 114, 128, 0.2)';
    cells.push(`<rect x="${x}" y="${y}" width="3" height="3" fill="${fill}"/>`);
  }

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
    '<rect x="1" y="1" width="22" height="22" fill="#1A1A1A" stroke="#3f3f46" stroke-width="1"/>',
    ...cells,
    '</svg>',
  ].join('');
}

function toDataUri(svg: string): string {
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function get16x19FaviconHref(isActive: boolean): string {
  return toDataUri(buildGridSvg(isActive));
}

function ensureFaviconLink(): HTMLLinkElement {
  const existing = document.querySelector('link[rel="icon"]');
  if (existing instanceof HTMLLinkElement) {
    existing.type = 'image/svg+xml';
    return existing;
  }

  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = 'image/svg+xml';
  document.head.appendChild(link);
  return link;
}

export function init16x19Favicon(): void {
  if (typeof document === 'undefined' || heartbeatIntervalId !== null) return;

  const favicon = ensureFaviconLink();
  const idleHref = get16x19FaviconHref(false);
  const activeHref = get16x19FaviconHref(true);
  let isActive = true;

  favicon.href = activeHref;

  heartbeatIntervalId = window.setInterval(() => {
    favicon.href = isActive ? activeHref : idleHref;
    isActive = !isActive;
  }, 1000);
}

