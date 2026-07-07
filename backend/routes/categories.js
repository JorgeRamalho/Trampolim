import { Router } from 'express';
import { store } from '../utils/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getCategories());
});

router.get('/:id', (req, res) => {
  const categories = store.getCategories();
  const category = categories.find(c => c.id === req.params.id);
  if (!category) return res.status(404).json({ error: 'Categoria não encontrada' });

  const products = store.getProducts().filter(p => p.category === category.id);
  res.json({ ...category, products });
});

export default router;
