import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { store } from '../utils/store.js';

const router = Router();

function generatePixCode(orderId, amount) {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `00020126580014BR.GOV.BCB.PIX0136${random}520400005303986540${amount.toFixed(2)}5802BR5913SuperEletroLar6009SAO PAULO62070503***6304${orderId.slice(0, 4).toUpperCase()}`;
}

function approveOrder(orderId, paymentMethod) {
  const orders = store.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === 'paid') return order;

  order.status = 'paid';
  if (paymentMethod) order.payment = paymentMethod;
  order.trackingCode = order.trackingCode || `SEL${Date.now().toString(36).toUpperCase()}`;
  store.saveOrders(orders);
  store.decrementStock(order.items);
  return order;
}

router.post('/pix', (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId e amount são obrigatórios' });
  }

  const payment = {
    id: uuidv4(),
    orderId,
    method: 'pix',
    amount: Number(amount),
    status: 'pending',
    pixCode: generatePixCode(orderId, Number(amount)),
    pixQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatePixCode(orderId, Number(amount)))}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  const payments = store.getPayments();
  payments.push(payment);
  store.savePayments(payments);

  res.status(201).json(payment);
});

router.post('/pix/confirm', (req, res) => {
  const { paymentId } = req.body;
  const payments = store.getPayments();
  const payment = payments.find(p => p.id === paymentId);

  if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });

  payment.status = 'approved';
  payment.approvedAt = new Date().toISOString();
  store.savePayments(payments);

  const approved = approveOrder(payment.orderId, 'pix');

  res.json({ status: 'approved', order: approved, trackingCode: approved?.trackingCode });
});

router.post('/card', (req, res) => {
  const { orderId, amount, cardNumber, cardName, expiry, cvv, installments } = req.body;

  if (!orderId || !amount || !cardNumber || !cardName || !expiry || !cvv) {
    return res.status(400).json({ error: 'Dados do cartão incompletos' });
  }

  const lastFour = cardNumber.replace(/\s/g, '').slice(-4);
  const isApproved = !cardNumber.replace(/\s/g, '').startsWith('0000');

  const payment = {
    id: uuidv4(),
    orderId,
    method: 'credit_card',
    amount: Number(amount),
    installments: Number(installments) || 1,
    status: isApproved ? 'approved' : 'rejected',
    cardLastFour: lastFour,
    createdAt: new Date().toISOString(),
  };

  const payments = store.getPayments();
  payments.push(payment);
  store.savePayments(payments);

  if (isApproved) {
    const approved = approveOrder(orderId, 'credit_card');
    return res.json({ status: 'approved', payment, trackingCode: approved?.trackingCode });
  }

  res.status(400).json({ status: 'rejected', error: 'Cartão recusado. Verifique os dados ou tente outro cartão.' });
});

router.post('/mercadopago', (req, res) => {
  const { orderId, amount, paymentMethod } = req.body;

  if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN.includes('your-access-token')) {
    const payment = {
      id: uuidv4(),
      orderId,
      method: 'mercadopago',
      amount: Number(amount),
      status: 'sandbox_approved',
      sandbox: true,
      message: 'Modo sandbox: pagamento simulado com sucesso. Configure MERCADOPAGO_ACCESS_TOKEN para produção.',
      checkoutUrl: `#sandbox-checkout/${orderId}`,
      createdAt: new Date().toISOString(),
    };

    const payments = store.getPayments();
    payments.push(payment);
    store.savePayments(payments);

    const approved = approveOrder(orderId, 'mercadopago');

    return res.json({ ...payment, trackingCode: approved?.trackingCode });
  }

  res.json({
    message: 'Integração Mercado Pago pronta. Configure as chaves no .env',
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY,
    orderId,
    amount,
    paymentMethod,
  });
});

router.get('/:id/status', (req, res) => {
  const payments = store.getPayments();
  const payment = payments.find(p => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Pagamento não encontrado' });
  res.json(payment);
});

export default router;
