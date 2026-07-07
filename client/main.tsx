import { createRoot } from 'react-dom/client';
import './css/app.css';
import { App } from './App';
import { TooltipProvider } from './components/Tooltip';
import { RealtimeProvider } from './realtime/provider';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element');
}

createRoot(root).render(
  <TooltipProvider>
    <RealtimeProvider>
      <App />
    </RealtimeProvider>
  </TooltipProvider>
);
