import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export const store = {
  getProducts: () => readJSON('products.json'),
  saveProducts: (products) => writeJSON('products.json', products),
  getCategories: () => readJSON('categories.json'),
  getCarousel: () => readJSON('carousel.json'),
  getUsers: () => readJSON('users.json'),
  saveUsers: (users) => writeJSON('users.json', users),
  getOrders: () => readJSON('orders.json'),
  saveOrders: (orders) => writeJSON('orders.json', orders),
  getPayments: () => readJSON('payments.json'),
  savePayments: (payments) => writeJSON('payments.json', payments),

  decrementStock(orderItems) {
    const products = readJSON('products.json');
    orderItems.forEach(item => {
      const product = products.find(p => p.id === item.productId || p.id === item.id);
      if (product) product.stock = Math.max(0, product.stock - (item.qty || 1));
    });
    writeJSON('products.json', products);
    return products;
  },
};
