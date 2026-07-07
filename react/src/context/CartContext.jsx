import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('sel-cart') || '[]'));
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('sel-favorites') || '[]'));

  useEffect(() => { localStorage.setItem('sel-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('sel-favorites', JSON.stringify(favorites)); }, [favorites]);

  const addToCart = useCallback((productId) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === productId);
      if (existing) return prev.map(i => i.id === productId ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { id: productId, qty: 1 }];
    });
  }, []);

  const updateQty = useCallback((productId, delta) => {
    setCart(prev => prev.map(i => i.id === productId ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback((productId) => {
    setFavorites(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  }, []);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ cart, favorites, cartCount, addToCart, updateQty, removeFromCart, clearCart, toggleFavorite }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
