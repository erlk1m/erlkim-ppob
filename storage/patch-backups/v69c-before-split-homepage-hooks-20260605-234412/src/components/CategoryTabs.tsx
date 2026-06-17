import type { Category } from '../types';

type Props = {
  categories: Category[];
  active: string;
  onChange: (slug: string) => void;
};

export function CategoryTabs({ categories, active, onChange }: Props) {
  return (
    <section className="panel">
      <div className="sectionHead">
        <h2>Kategori</h2>
        <span>{categories.length} menu</span>
      </div>

      <div className="categoryGrid">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={cat.slug === active ? 'active' : ''}
            onClick={() => onChange(cat.slug)}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </section>
  );
}
