export const CATEGORIES = [
  { id: 'geladeiras', name: 'Geladeiras', icon: '🧊' },
  { id: 'fogoes', name: 'Fogões', icon: '🔥' },
  { id: 'lavadoras', name: 'Lavadoras', icon: '🫧' },
  { id: 'tvs', name: 'Smart TVs', icon: '📺' },
  { id: 'ar', name: 'Ar-condicionado', icon: '❄️' },
  { id: 'micro', name: 'Micro-ondas', icon: '📡' },
  { id: 'celulares', name: 'Celulares', icon: '📱' },
  { id: 'notebooks', name: 'Notebooks', icon: '💻' },
];

export const PRODUCTS = [
  { id: 1, name: 'Geladeira Frost Free 443L Inox', category: 'geladeiras', price: 3299.90, oldPrice: 4299.90, rating: 4.8, reviews: 234, badge: '-23%', emoji: '🧊' },
  { id: 2, name: 'Fogão 5 Bocas com Forno Elétrico', category: 'fogoes', price: 1899.00, oldPrice: 2299.00, rating: 4.6, reviews: 189, badge: '-17%', emoji: '🔥' },
  { id: 3, name: 'Lavadora 12kg Turbo Economia', category: 'lavadoras', price: 2499.90, oldPrice: 3199.90, rating: 4.7, reviews: 312, badge: '-22%', emoji: '🫧' },
  { id: 4, name: 'Smart TV 55" 4K UHD HDR', category: 'tvs', price: 2799.00, oldPrice: 3499.00, rating: 4.9, reviews: 567, badge: '-20%', emoji: '📺' },
  { id: 5, name: 'Ar-condicionado Split 12000 BTUs', category: 'ar', price: 2199.90, oldPrice: 2799.90, rating: 4.5, reviews: 145, badge: '-21%', emoji: '❄️' },
  { id: 6, name: 'Micro-ondas 32L com Grill', category: 'micro', price: 699.90, oldPrice: 899.90, rating: 4.4, reviews: 98, badge: '-22%', emoji: '📡' },
  { id: 7, name: 'Smartphone 256GB 5G Câmera Pro', category: 'celulares', price: 3499.00, oldPrice: 4299.00, rating: 4.8, reviews: 423, badge: '-19%', emoji: '📱' },
  { id: 8, name: 'Notebook 15" i7 16GB SSD 512GB', category: 'notebooks', price: 4599.90, oldPrice: 5499.90, rating: 4.7, reviews: 201, badge: '-16%', emoji: '💻' },
  { id: 9, name: 'Geladeira Duplex 380L Branca', category: 'geladeiras', price: 2599.00, oldPrice: 3199.00, rating: 4.5, reviews: 167, badge: '-19%', emoji: '🧊' },
  { id: 10, name: 'Fogão Cooktop 4 Bocas Vitrocerâmico', category: 'fogoes', price: 1299.90, oldPrice: 1599.90, rating: 4.6, reviews: 89, badge: '-19%', emoji: '🔥' },
  { id: 11, name: 'Smart TV 65" QLED 120Hz', category: 'tvs', price: 4999.00, oldPrice: 6499.00, rating: 4.9, reviews: 312, badge: '-23%', emoji: '📺' },
  { id: 12, name: 'Lava e Seca 11kg Inverter', category: 'lavadoras', price: 3899.90, oldPrice: 4799.90, rating: 4.8, reviews: 278, badge: '-19%', emoji: '🫧' },
];

export const formatPrice = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const installment = (price) => {
  const parcela = price / 12;
  return `ou 12x de ${formatPrice(parcela)} sem juros`;
};

export const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let stars = '★'.repeat(full);
  if (half) stars += '½';
  stars += '☆'.repeat(5 - full - (half ? 1 : 0));
  return stars;
};
