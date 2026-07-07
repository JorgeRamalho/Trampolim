import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES, formatPrice, installment, renderStars } from '../data/products';

export default function ProductCard({ product, isFavorite, onAddToCart, onToggleFavorite, onOpen }) {
  const { categories } = useStore();
  const categoryName = categories.find(c => c.id === product.category)?.name || product.category;

  return (
    <article className="product-card" role="listitem">
      <div className="product-image" onClick={() => onOpen?.(product.id)} style={{ cursor: 'pointer' }}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className={`product-favorite ${isFavorite ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(product.id); }}
          aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
        {product.image
          ? <img src={product.image} alt={product.name} loading="lazy" width="300" height="300" />
          : <span style={{ fontSize: '5rem' }} aria-hidden="true">{product.emoji || '📦'}</span>}
      </div>
      <div className="product-info" onClick={() => onOpen?.(product.id)} style={{ cursor: 'pointer' }}>
        <span className="product-category">{categoryName}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-rating">
          <span className="stars" aria-hidden="true">{renderStars(product.rating)}</span>
          <span>({product.reviews})</span>
        </div>
        <div className="product-price">
          <span className="price-current">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="price-old">{formatPrice(product.oldPrice)}</span>}
          <div className="price-installment">{installment(product.price)}</div>
        </div>
      </div>
      <div className="product-actions">
        <button className="btn btn-primary btn-sm add-to-cart"
          onClick={() => onAddToCart(product.id, product.name)}
          aria-label={`Adicionar ${product.name} ao carrinho`}>
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}
