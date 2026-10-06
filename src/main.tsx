import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  if ('serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then(reg => {
            reg.update();
          })
          .catch(() => {
            // SW registration failed
          });
      });
    } else {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
  }
}
