import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import './styles.css';
import './styles/v58-design-system.css';
import './styles/v59-homepage-polish.css';
import './styles/v60-product-grid-polish.css';
import './styles/v61-checkout-ui-polish.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
