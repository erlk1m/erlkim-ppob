import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import TermsPage from './components/TermsPage.jsx';
import './index.css';

function isTermsPagePath() {
  const raw = String(window.location.pathname || '');
  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch {}

  return raw === '/syarat-ketentuan'
    || raw === '/sk'
    || raw === '/s&k'
    || raw === '/s%26k'
    || decoded === '/syarat-ketentuan'
    || decoded === '/sk'
    || decoded === '/s&k';
}

function RootRouter() {
  if (isTermsPagePath()) return <TermsPage />;
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootRouter />
  </React.StrictMode>
);
