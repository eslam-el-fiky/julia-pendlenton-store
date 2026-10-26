const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const router = express.Router();

function redirectBack(req, res) { res.redirect(req.get('referer') || '/shop'); }

router.get('/', async (req, res, next) => {
  try {
    const cart = req.session.cart || [];
    const ids = cart.filter(i => mongoose.isValidObjectId(i.productId)).map(i => i.productId);
    const products = await Product.find({ _id: { $in: ids }, isActive: true });
    const items = cart.map(item => {
      const product = products.find(p => p._id.toString() === item.productId);
      if (!product) return null;
      const quantity = Math.min(item.quantity, product.stock);
      return { product, quantity, lineTotal: product.price * quantity };
    }).filter(Boolean);
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    res.render('cart/index', { pageTitle: 'Your Bag', items, subtotal });
  } catch (err) { next(err); }
});

router.post('/add', async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.body.productId, isActive: true });
    const quantity = Math.max(1, Math.min(10, parseInt(req.body.quantity, 10) || 1));
    if (!product || product.stock < 1) {
      req.session.flash = { type: 'error', message: 'This product is currently unavailable.' };
      return redirectBack(req, res);
    }
    req.session.cart = req.session.cart || [];
    const existing = req.session.cart.find(i => i.productId === product._id.toString());
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) {
      req.session.flash = { type: 'error', message: `Only ${product.stock} item(s) are currently available.` };
      return redirectBack(req, res);
    }
    if (existing) existing.quantity = nextQuantity;
    else req.session.cart.push({ productId: product._id.toString(), quantity });
    req.session.flash = { type: 'success', message: `${product.title} added to your bag.` };
    redirectBack(req, res);
  } catch (err) { next(err); }
});

router.post('/update', async (req, res, next) => {
  try {
    const productId = String(req.body.productId || '');
    const quantity = parseInt(req.body.quantity, 10);
    const item = (req.session.cart || []).find(i => i.productId === productId);
    if (item) {
      const product = await Product.findById(productId);
      if (!product || quantity <= 0) req.session.cart = req.session.cart.filter(i => i.productId !== productId);
      else item.quantity = Math.min(quantity, product.stock, 10);
    }
    res.redirect('/cart');
  } catch (err) { next(err); }
});

router.post('/remove', (req, res) => {
  req.session.cart = (req.session.cart || []).filter(i => i.productId !== String(req.body.productId));
  res.redirect('/cart');
});

module.exports = router;
