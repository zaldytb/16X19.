import { createRoot } from 'react-dom/client';
import '../style.css';
import App from './App.js';
import { init16x19Favicon } from './ui/favicon.js';

init16x19Favicon();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}

createRoot(rootEl).render(<App />);
