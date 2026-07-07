import { useState } from 'react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../data/products';

export default function CheckoutView({ onComplete, showToast }) {
  const { products } = useStore();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [payment, setPayment] = useState('pix');
  const [pixData, setPixData] = useState(null);
  const [trackingCode, setTrackingCode] = useState(null);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: user?.phone || '',
    cep: '', street: '', number: '', complement: '', city: '', state: '',
    card: '', cardName: '', expiry: '', cvv: '', installments: '1',
  });

  const subtotal = cart.reduce((s, i) => {
    const p = products.find(pr => pr.id === i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const createOrder = () => api.createOrder({
    items: cart,
    shipping: 'standard',
    customer: { name: form.name, email: form.email, phone: form.phone },
    address: { cep: form.cep, street: form.street, number: form.number, complement: form.complement, city: form.city, state: form.state },
  });

  const handlePay = async () => {
    try {
      const order = await createOrder();
      if (payment === 'pix') {
        const pix = await api.createPixPayment(order.id, subtotal);
        setPixData({ ...pix, orderId: order.id });
        return;
      }
      let result;
      if (payment === 'card') {
        result = await api.payWithCard({
          orderId: order.id, amount: subtotal,
          cardNumber: form.card, cardName: form.cardName,
          expiry: form.expiry, cvv: form.cvv, installments: form.installments,
        });
      } else {
        result = await api.payWithMercadoPago(order.id, subtotal);
      }
      setTrackingCode(result.trackingCode);
      clearCart();
      setStep(4);
      showToast('🎉 Pagamento aprovado!');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  const confirmPix = async () => {
    try {
      const result = await api.confirmPixPayment(pixData.id);
      setTrackingCode(result.trackingCode);
      clearCart();
      setPixData(null);
      setStep(4);
      showToast('🎉 Pagamento Pix confirmado!');
    } catch (err) {
      showToast(`❌ ${err.message}`);
    }
  };

  if (pixData) {
    return (
      <section aria-label="Pagamento Pix">
        <div className="checkout-panel">
          <h3>💚 Pague com Pix</h3>
          <div className="pix-qr">
            <img src={pixData.pixQrCode} alt="QR Code Pix" width="250" height="250" />
            <div className="pix-code">{pixData.pixCode}</div>
            <button className="btn btn-outline btn-sm" onClick={() => { navigator.clipboard?.writeText(pixData.pixCode); showToast('📋 Código copiado!'); }}>
              📋 Copiar código Pix
            </button>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={confirmPix}>Já paguei</button>
          </div>
        </div>
      </section>
    );
  }

  if (step === 4) {
    return (
      <div className="order-success">
        <div className="order-success-icon">🎉</div>
        <h2>Pedido confirmado!</h2>
        {trackingCode && <div className="tracking-code">{trackingCode}</div>}
        <button className="btn btn-primary" onClick={onComplete} style={{ marginTop: '1rem' }}>Continuar comprando</button>
      </div>
    );
  }

  const steps = ['Dados', 'Endereço', 'Pagamento'];

  return (
    <section aria-label="Checkout">
      <div className="checkout-steps">
        {steps.map((s, i) => (
          <div key={s} className={`checkout-step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`}>{i + 1}. {s}</div>
        ))}
      </div>
      <div className="cart-summary" style={{ marginBottom: '1.5rem', position: 'static' }}>
        <div className="summary-row total"><span>Total</span><span>{formatPrice(subtotal)}</span></div>
      </div>

      {step === 1 && (
        <div className="checkout-panel">
          <h3>Seus dados</h3>
          {['name', 'email', 'phone'].map(f => (
            <div key={f} className="form-group">
              <label className="form-label">{f === 'name' ? 'Nome' : f === 'email' ? 'E-mail' : 'Telefone'}</label>
              <input className="form-input" type={f === 'email' ? 'email' : f === 'phone' ? 'tel' : 'text'}
                value={form[f]} onChange={e => update(f, e.target.value)} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(2)}>Continuar</button>
        </div>
      )}

      {step === 2 && (
        <div className="checkout-panel">
          <h3>Endereço de entrega</h3>
          {['cep', 'street', 'number', 'complement', 'city', 'state'].map(f => (
            <div key={f} className="form-group">
              <label className="form-label">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
              <input className="form-input" value={form[f]} onChange={e => update(f, e.target.value)} />
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setStep(3)}>Continuar</button>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-panel">
          <h3>Forma de pagamento</h3>
          <div className="payment-methods">
            {[
              { id: 'pix', icon: '💚', title: 'Pix', desc: 'Aprovação instantânea' },
              { id: 'card', icon: '💳', title: 'Cartão de crédito', desc: 'Até 12x sem juros' },
              { id: 'mercadopago', icon: '🛒', title: 'Mercado Pago', desc: 'Pix, boleto ou cartão' },
            ].map(m => (
              <label key={m.id} className={`payment-option ${payment === m.id ? 'selected' : ''}`} onClick={() => setPayment(m.id)}>
                <input type="radio" name="payment" value={m.id} checked={payment === m.id} readOnly />
                <span className="payment-icon">{m.icon}</span>
                <div><strong>{m.title}</strong><br /><small>{m.desc}</small></div>
              </label>
            ))}
          </div>
          {payment === 'card' && (
            <div style={{ marginTop: '1rem' }}>
              <div className="form-group"><label className="form-label">Número do cartão</label>
                <input className="form-input" value={form.card} onChange={e => update('card', e.target.value)} placeholder="0000 0000 0000 0000" /></div>
              <div className="form-group"><label className="form-label">Nome no cartão</label>
                <input className="form-input" value={form.cardName} onChange={e => update('cardName', e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Validade</label>
                  <input className="form-input" value={form.expiry} onChange={e => update('expiry', e.target.value)} placeholder="MM/AA" /></div>
                <div className="form-group"><label className="form-label">CVV</label>
                  <input className="form-input" value={form.cvv} onChange={e => update('cvv', e.target.value)} type="password" /></div>
              </div>
            </div>
          )}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handlePay}>
            Pagar {formatPrice(subtotal)}
          </button>
        </div>
      )}
    </section>
  );
}
