import type { Category } from '../types';

type Props = {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
};

export function CategoryTabs({ categories, active, onChange }: Props) {
  return (
    <section className="sf-section sf-category-section">
      <div className="sf-section-head">
        <div>
          <p className="sf-section-kicker">Kategori layanan</p>
          <h2>Pilih kebutuhan kamu</h2>
        </div>
        <span>{categories.length} menu</span>
      </div>

      <div className="sf-category-grid">
        {categories.map((cat) => {
          const isActive = cat.slug === active;

          return (
            <button
              key={cat.slug}
              type="button"
              className={`sf-category-card ${isActive ? 'is-active' : ''}`}
              onClick={() => onChange(cat.slug)}
            >
              <span className="sf-category-dot" />
              <strong>{cat.name}</strong>
            </button>
          );
        })}
      </div>
    </section>
  );
}
