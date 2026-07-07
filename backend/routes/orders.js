import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../utils/store.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', optionalAuth, (req, res) => {
  try {
    const { items, shipping, payment, address, customer } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: 'Carrinho vazio' });
    }

    const products = store.getProducts();
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) throw new Error(`Produto ${item.id} não encontrado`);
      if (product.stock < item.qty) throw new Error(`${product.name} sem estoque suficiente`);
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: item.qty,
        image: product.image,
      };
    });

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const shippingCost = shipping === 'express' ? 49.90 : 0;
    const total = subtotal + shippingCost;

    const order = {
      id: uuidv4(),
      userId: req.user?.id || null,
      items: orderItems,
      subtotal,
      shipping: shippingCost,
      total,
      payment: payment || 'pending',
      address: address || {},
      customer: customer || (req.user ? { name: req.user.name, email: req.user.email } : {}),
      status: 'pending',
      createdAt: new Date().toISOString(),
      trackingCode: null,
    };

    const orders = store.getOrders();
    orders.push(order);
    store.saveOrders(orders);

    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authMiddleware, (req, res) => {
  const orders = store.getOrders().filter(o => o.userId === req.user.id);
  res.json(orders.reverse());
});

router.get('/:id', authMiddleware, (req, res) => {
  const orders = store.getOrders();
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
  res.json(order);
});

router.get('/track/:code', (req, res) => {
  const orders = store.getOrders();
  const order = orders.find(o => o.id === req.params.code || o.trackingCode === req.params.code);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });

  res.json({
    id: order.id,
    status: order.status,
    trackingCode: order.trackingCode || order.id.slice(0, 8).toUpperCase(),
    createdAt: order.createdAt,
    items: order.items.map(i => ({ name: i.name, qty: i.qty })),
    total: order.total,
  });
});

export default router;
