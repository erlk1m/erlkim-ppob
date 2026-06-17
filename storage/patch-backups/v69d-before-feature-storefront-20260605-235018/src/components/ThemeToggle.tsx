import type { Theme } from '../types';

type Props = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export function ThemeToggle({ theme, setTheme }: Props) {
  return (
    <div className="themeToggle" aria-label="Pilih tema">
      <button
        type="button"
        aria-label="Tema Halloween"
        aria-pressed={theme === 'halloween'}
        onClick={() => setTheme('halloween')}
      >
        🎃
      </button>
      <button
        type="button"
        aria-label="Tema Hujan Petir"
        aria-pressed={theme === 'storm'}
        onClick={() => setTheme('storm')}
      >
        ⛈️
      </button>
    </div>
  );
}
