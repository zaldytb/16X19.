import { createRoot } from 'react-dom/client';
import '../style.css';
import './ui/pages/compare/compare.css';
import App from './App.js';
import { installWindowBridge } from './bridge/installWindowBridge.js';

installWindowBridge();

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Missing #root element');
}

createRoot(rootEl).render(<App />);
