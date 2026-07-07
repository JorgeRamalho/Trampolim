const API_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('sel-token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) localStorage.setItem('sel-token', token);
    else localStorage.removeItem('sel-token');
  }

  getUser() {
    const data = localStorage.getItem('sel-user');
    return data ? JSON.parse(data) : null;
  }

  setUser(user) {
    if (user) localStorage.setItem('sel-user', JSON.stringify(user));
    else localStorage.removeItem('sel-user');
  }

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Erro ${response.status}`);
    return data;
  }

  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  register(name, email, password, phone) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
  }

  logout() { this.setToken(null); this.setUser(null); }

  getMe() { return this.request('/auth/me'); }
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products${query ? `?${query}` : ''}`);
  }
  getProduct(id) { return this.request(`/products/${id}`); }
  getCategories() { return this.request('/categories'); }
  createOrder(data) { return this.request('/orders', { method: 'POST', body: JSON.stringify(data) }); }
  getOrders() { return this.request('/orders'); }
  trackOrder(code) { return this.request(`/orders/track/${code}`); }
  createPixPayment(orderId, amount) {
    return this.request('/payments/pix', { method: 'POST', body: JSON.stringify({ orderId, amount }) });
  }
  confirmPixPayment(paymentId) {
    return this.request('/payments/pix/confirm', { method: 'POST', body: JSON.stringify({ paymentId }) });
  }
  payWithCard(data) { return this.request('/payments/card', { method: 'POST', body: JSON.stringify(data) }); }
  payWithMercadoPago(orderId, amount, paymentMethod = 'pix') {
    return this.request('/payments/mercadopago', { method: 'POST', body: JSON.stringify({ orderId, amount, paymentMethod }) });
  }
}

export const api = new ApiClient();
