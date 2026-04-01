import { createRoot } from 'react-dom/client';
import '../style.css';
import { initCatalog } from './data/loader.js';
import { init16x19Favicon } from './ui/favicon.js';

init16x19Favicon();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}

async function boot(): Promise<void> {
  await initCatalog();
  const { default: App } = await import('./App.js');
  createRoot(rootEl as HTMLElement).render(<App />);
}

void boot();
