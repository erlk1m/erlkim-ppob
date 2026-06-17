import { useEffect, useState } from 'react';
import type { Theme } from './types';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { InvoicePage } from './pages/InvoicePage';
import { CheckPage } from './pages/CheckPage';

export function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('erlkim-fresh-theme');
    return saved === 'storm' ? 'storm' : 'halloween';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('erlkim-fresh-theme', theme);
  }, [theme]);

  const path = location.pathname;
  const invoiceMatch = path.match(/^\/invoice\/([^/]+)/);

  return (
    <>
      <div className="weatherLayer" aria-hidden="true" />
      <Header theme={theme} setTheme={setTheme} />
      {invoiceMatch ? (
        <InvoicePage invoice={decodeURIComponent(invoiceMatch[1])} />
      ) : path === '/cek' ? (
        <CheckPage />
      ) : (
        <HomePage />
      )}
    </>
  );
}
