import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/products';

export default function CartView({ onExplore, onCheckout }) {
  const { products } = useStore();
  const { cart, updateQty, removeFromCart } = useCart();

  if (!cart.length) {
    return (
      <section aria-label="Carrinho">
        <div className="section-header"><h2 className="section-title">🛒 Meu Carrinho</h2></div>
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h2>Seu carrinho está vazio</h2>
          <p>Explore nossos produtos e encontre o ideal para seu lar.</p>
          <button className="btn btn-primary" onClick={onExplore}>Explorar produtos</button>
        </div>
      </section>
    );
  }

  const subtotal = cart.reduce((s, i) => {
    const p = products.find(pr => pr.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  return (
    <section aria-label="Carrinho">
      <div className="section-header"><h2 className="section-title">🛒 Meu Carrinho</h2></div>
      <div className="cart-items">
        {cart.map(item => {
          const product = products.find(p => p.id === item.id);
          if (!product) return null;
          return (
            <div key={item.id} className="cart-item">
              <div className="cart-item-image">
                {product.image
                  ? <img src={product.image} alt={product.name} width="80" height="80" />
                  : <span style={{ fontSize: '2.5rem' }}>{product.emoji}</span>}
              </div>
              <div className="cart-item-info">
                <div className="cart-item-name">{product.name}</div>
                <div className="cart-item-price">{formatPrice(product.price)}</div>
                <div className="cart-item-controls">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span className="qty-value">{item.qty}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  <button className="qty-btn" onClick={() => removeFromCart(item.id)} style={{ marginLeft: 'auto', color: 'var(--color-secondary)' }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cart-summary">
        <div className="summary-row"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
        <div className="summary-row"><span>Frete</span><span style={{ color: 'var(--color-accent)' }}>Grátis</span></div>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onCheckout}>Finalizar compra</button>
      </div>
    </section>
  );
}
