import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { CATEGORIES as FALLBACK_CATEGORIES, PRODUCTS as FALLBACK_PRODUCTS } from '../data/products';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCategories(), api.getProducts()])
      .then(([cats, prods]) => { setCategories(cats); setProducts(prods); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <StoreContext.Provider value={{ products, categories, loading }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
