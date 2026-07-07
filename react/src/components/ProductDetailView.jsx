import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { formatPrice, installment, renderStars } from '../data/products';
import ProductCard from './ProductCard';

export default function ProductDetailView({ productId, onBack }) {
  const { categories } = useStore();
  const { favorites, addToCart, toggleFavorite } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProduct(productId)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div> Carregando...</div>;
  if (!product) return <p>Produto não encontrado.</p>;

  const catName = categories.find(c => c.id === product.category)?.name;

  return (
    <section aria-label="Detalhe do produto">
      <div className="product-detail">
        <div className="product-detail-gallery">
          <img src={product.image} alt={product.name} width="600" height="600" />
        </div>
        <div className="product-detail-info">
          <span className="product-category">{catName}</span>
          <h1>{product.name}</h1>
          <p className="product-detail-brand">Marca: {product.brand}</p>
          <div className="product-rating" style={{ marginBottom: '1rem' }}>
            <span className="stars">{renderStars(product.rating)}</span>
            <span>({product.reviews} avaliações)</span>
          </div>
          <div className={`stock-badge ${product.stock < 10 ? 'low' : ''}`}>
            {product.stock < 10 ? '⚠️ Últimas unidades' : '✅ Em estoque'}
          </div>
          <div className="product-detail-price">
            <span className="price-current">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="price-old">{formatPrice(product.oldPrice)}</span>}
            <div className="price-installment">{installment(product.price)}</div>
          </div>
          <p className="product-detail-desc">{product.description}</p>
          {product.specs && (
            <div className="specs-grid">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="spec-item"><strong>{k}</strong>{v}</div>
              ))}
            </div>
          )}
          <div className="product-detail-actions">
            <button className="btn btn-primary" onClick={() => addToCart(product.id)}>Adicionar ao carrinho</button>
            <button className="btn btn-outline" onClick={onBack}>Voltar</button>
          </div>
        </div>
      </div>
      {product.related?.length > 0 && (
        <>
          <div className="section-header"><h2 className="section-title">Produtos relacionados</h2></div>
          <div className="products-grid" role="list">
            {product.related.map(p => (
              <ProductCard key={p.id} product={p} isFavorite={favorites.includes(p.id)}
                onAddToCart={() => addToCart(p.id)} onToggleFavorite={() => toggleFavorite(p.id)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
