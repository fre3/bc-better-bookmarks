import { initializeAppearance } from './browser/appearance';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import './ui/style.css';
void initializeAppearance().then(() => createRoot(document.getElementById('root')!).render(<App />));
