import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ onClose, initialTab = 'login' }) {
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState('');
  const { login, register, loading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const form = e.target;
    try {
      if (tab === 'login') {
        await login(form.email.value, form.password.value);
      } else {
        await register(form.name.value, form.email.value, form.password.value, form.phone?.value);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-label="Autenticação">
        <div className="modal-header">
          <h2 className="modal-title">Minha Conta</h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="form-tabs">
          <button className={`form-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Entrar</button>
          <button className={`form-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Cadastrar</button>
        </div>
        <form onSubmit={handleSubmit}>
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="auth-name">Nome</label>
              <input className="form-input" id="auth-name" name="name" required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">E-mail</label>
            <input className="form-input" id="auth-email" name="email" type="email" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Senha</label>
            <input className="form-input" id="auth-password" name="password" type="password" required minLength={6} />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
