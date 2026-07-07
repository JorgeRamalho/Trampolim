import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import ProductCard from './ProductCard';

export default function OffersView({ onOpenProduct }) {
  const { products } = useStore();
  const { favorites, addToCart, toggleFavorite } = useCart();
  const offers = products.filter(p => p.badge);

  return (
    <section aria-label="Ofertas especiais">
      <div className="hero" style={{ minHeight: '200px', marginBottom: '1.5rem' }}>
        <div className="hero-content">
          <span className="hero-emoji">🔥💰</span>
          <h1>Ofertas Imperdíveis</h1>
          <p>Descontos exclusivos em produtos selecionados para seu lar.</p>
        </div>
      </div>
      <div className="products-grid" role="list">
        {offers.map(p => (
          <ProductCard key={p.id} product={p} isFavorite={favorites.includes(p.id)}
            onAddToCart={(id) => addToCart(id)} onToggleFavorite={toggleFavorite} onOpen={onOpenProduct} />
        ))}
      </div>
    </section>
  );
}
