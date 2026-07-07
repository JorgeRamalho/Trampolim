import { Router } from 'express';
import { store } from '../utils/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getCarousel());
});

export default router;
