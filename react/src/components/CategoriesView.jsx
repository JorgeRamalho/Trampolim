import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard';

export default function CategoriesView({ activeCategory, setActiveCategory, onOpenProduct }) {
  const { products, categories } = useStore();
  const { favorites, addToCart, toggleFavorite } = useCart();

  const filtered = activeCategory ? products.filter(p => p.category === activeCategory) : [];
  const activeCat = categories.find(c => c.id === activeCategory);

  return (
    <section aria-label="Categorias">
      <div className="section-header"><h2 className="section-title">Todas as Categorias</h2></div>
      <div className="products-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {categories.map(cat => (
          <button key={cat.id} className={`category-card ${activeCategory === cat.id ? 'active' : ''}`}
            style={{ minHeight: '120px' }} onClick={() => setActiveCategory(cat.id)}>
            <span className="category-icon" style={{ fontSize: '2.5rem' }}>{cat.icon}</span>
            <span className="category-name">{cat.name}</span>
          </button>
        ))}
      </div>
      {activeCategory && (
        <>
          <div className="section-header" style={{ marginTop: '2rem' }}>
            <h2 className="section-title">{activeCat?.icon} {activeCat?.name}</h2>
          </div>
          <div className="products-grid" role="list">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} isFavorite={favorites.includes(p.id)}
                onAddToCart={(id) => addToCart(id)} onToggleFavorite={toggleFavorite} onOpen={onOpenProduct} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
