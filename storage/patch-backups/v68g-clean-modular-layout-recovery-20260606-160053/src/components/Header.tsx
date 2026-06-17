import type { Theme } from '../types';
import { ThemeToggle } from './ThemeToggle';

type Props = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export function Header({ theme, setTheme }: Props) {
  return (
    <header className="header">
      <a className="brand" href="/">
        <span className="brandIcon">⚡</span>
        <span>
          <strong>ERLKIM</strong>
          <small>PPOB Store</small>
        </span>
      </a>

      <nav className="nav">
        <a href="/">Produk</a>
        <a href="/cek">Cek Invoice</a>
      </nav>

      <ThemeToggle theme={theme} setTheme={setTheme} />
    </header>
  );
}
