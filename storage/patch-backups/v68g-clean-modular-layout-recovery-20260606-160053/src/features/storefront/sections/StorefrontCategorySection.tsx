import { CategoryTabs } from '../../../components/CategoryTabs';
import { useStorefront } from '../StorefrontProvider';

export function StorefrontCategorySection() {
  const { catalog, changeCategoryAndResetCheckout } = useStorefront();

  return (
    <CategoryTabs
      categories={catalog.categories}
      active={catalog.activeCategory}
      onChange={changeCategoryAndResetCheckout}
    />
  );
}
