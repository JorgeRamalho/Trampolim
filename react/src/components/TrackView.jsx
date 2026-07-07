import { useState } from 'react';
import { api } from '../services/api';
import { formatPrice } from '../data/products';

export default function TrackView() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      const order = await api.trackOrder(code);
      setResult(order);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section aria-label="Rastrear pedido">
      <div className="section-header"><h2 className="section-title">📦 Rastrear Pedido</h2></div>
      <div className="checkout-panel">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="track-code">Código de rastreamento</label>
            <input className="form-input" id="track-code" value={code} onChange={e => setCode(e.target.value)} placeholder="Ex: SEL1A2B3C4D" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Rastrear</button>
        </form>
        {error && <p className="form-error" style={{ marginTop: '1rem' }}>{error}</p>}
        {result && (
          <div className="checkout-panel" style={{ marginTop: '1rem' }}>
            <h3>📦 Pedido {result.trackingCode}</h3>
            <p>Status: <strong>{result.status === 'paid' ? '✅ Pago' : '⏳ Pendente'}</strong></p>
            <p>Data: {new Date(result.createdAt).toLocaleDateString('pt-BR')}</p>
            <p>Total: {formatPrice(result.total)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
