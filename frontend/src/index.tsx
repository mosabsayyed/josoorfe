import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './i18n';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

if (!Object.hasOwn) {
  Object.hasOwn = function hasOwn(object: object, property: PropertyKey): boolean {
    return Object.prototype.hasOwnProperty.call(Object(object), property);
  };
}

const container = document.getElementById('root') as HTMLElement;

const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (container.hasChildNodes()) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}

reportWebVitals();
