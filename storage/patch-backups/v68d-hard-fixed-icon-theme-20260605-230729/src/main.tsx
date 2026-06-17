import './theme/v68c-icon-only-theme-toggle.css';
import './theme/v68c-icon-only-theme-toggle';
import './theme/v68-theme-foundation.css';
import './styles/v70b-remove-legacy-header-theme-buttons.css';
import './v70b-remove-legacy-header-theme-buttons';
import './styles/v70-clean-two-theme-system.css';
import './v70-clean-two-theme-system';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
