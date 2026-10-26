const express = require('express');
const Product = require('../models/Product');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const featured = await Product.find({ isActive: true, featured: true, category: { $ne: 'Gift Sets' } }).sort({ createdAt: -1 }).limit(4);
    res.render('shop/index', { pageTitle: 'Julia Pendlenton Store', featured });
  } catch (err) { next(err); }
});

router.get('/checkout', async (req, res, next) => {
  try {
    const cart = req.session.cart || [];
    const ids = cart.map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const items = cart.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) return null;
      const quantity = Math.min(item.quantity, product.stock);
      return { product, quantity, lineTotal: product.price * quantity };
    }).filter(Boolean);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    res.render('checkout/index', { pageTitle: 'Checkout', items, subtotal });
  } catch (err) { next(err); }
});

router.post('/checkout/whatsapp', async (req, res, next) => {
  try {
    const cart = req.session.cart || [];
    if (!cart.length) {
      req.session.flash = { type: 'error', message: 'Your bag is empty.' };
      return res.redirect('/cart');
    }

    const ids = cart.map(item => item.productId);
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const items = [];
    for (const item of cart) {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product || item.quantity < 1 || item.quantity > product.stock) {
        req.session.flash = { type: 'error', message: 'A product is unavailable or its stock changed. Please review your bag.' };
        return res.redirect('/cart');
      }
      items.push({ title: product.title, price: product.price, quantity: item.quantity, lineTotal: product.price * item.quantity });
    }

    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim();
    const address = String(req.body.address || '').trim();
    const city = String(req.body.city || '').trim();
    const giftMessage = String(req.body.giftMessage || '').trim().slice(0, 500);
    if (!name || !phone || !address || !city) {
      req.session.flash = { type: 'error', message: 'Please complete your name, phone, city and address.' };
      return res.redirect('/checkout');
    }

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal;
    const lines = [
      'Hello Julia Pendlenton Store! I would like to place an order:',
      '',
      ...items.map((item, index) => `${index + 1}. ${item.title} | Quantity: ${item.quantity} | Unit price: ${item.price.toLocaleString('en-US')} KWD | Total: ${item.lineTotal.toLocaleString('en-US')} KWD`),
      '',
      `Subtotal: ${subtotal.toLocaleString('en-US')} KWD`,
      `Total: ${total.toLocaleString('en-US')} KWD`,
      '',
      'Customer details:',
      `Name: ${name}`,
      `Phone: ${phone}`,
      ...(email ? [`Email: ${email}`] : []),
      `City / Area: ${city}`,
      `Full address: ${address}`,
      ...(giftMessage ? [`Gift message: ${giftMessage}`] : []),
    ];
    const whatsappUrl = `https://wa.me/201027912310?text=${encodeURIComponent(lines.join('\n'))}`;
    res.redirect(whatsappUrl);
  } catch (err) { next(err); }
});

router.get('/shop', async (req, res, next) => {
  try {
    const filter = { isActive: true, category: { $ne: 'Gift Sets' } };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.q) filter.title = { $regex: req.query.q, $options: 'i' };
    const products = await Product.find(filter).sort({ featured: -1, createdAt: -1 });
    const categories = await Product.distinct('category', { isActive: true, category: { $ne: 'Gift Sets' } });
    res.render('products/list', { pageTitle: 'Shop Collection', products, categories, search: req.query.q || '', selectedCategory: req.query.category || '' });
  } catch (err) { next(err); }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true });
    if (!product) return res.status(404).render('404', { pageTitle: 'Product not found' });
    const related = product.category === 'Gift Sets' ? [] : await Product.find({ isActive: true, category: product.category, _id: { $ne: product._id } }).limit(3);
    res.render('products/detail', { pageTitle: product.title, product, related });
  } catch (err) { next(err); }
});

module.exports = router;
