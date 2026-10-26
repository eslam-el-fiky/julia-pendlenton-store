const express = require('express');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { requireAdmin } = require('../middleware/auth');
const router = express.Router();

router.use(requireAdmin);

router.get('/', async (req, res, next) => {
  try {
    const [productCount, ordersCount, newOrders, revenueAgg, lowStock] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.find({ status: 'new' }).sort({ createdAt: -1 }).limit(8),
      Order.aggregate([{ $match: { status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
      Product.find({ isActive: true, stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8)
    ]);
    res.render('admin/dashboard', { pageTitle: 'Admin Dashboard', productCount, ordersCount, newOrders, revenue: revenueAgg[0]?.total || 0, lowStock });
  } catch (err) { next(err); }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/products', { pageTitle: 'Manage Products', products });
  } catch (err) { next(err); }
});

router.get('/products/new', (req, res) => res.render('admin/product-form', { pageTitle: 'Add Product', product: null }));
router.post('/products', async (req, res, next) => {
  try {
    const data = productData(req.body);
    await Product.create(data);
    req.session.flash = { type: 'success', message: 'Product created.' };
    res.redirect('/admin/products');
  } catch (err) {
    if (err.code === 11000) {
      req.session.flash = { type: 'error', message: 'That product slug is already in use.' };
      return res.redirect('/admin/products/new');
    }
    next(err);
  }
});

router.get('/products/:id/edit', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).render('404', { pageTitle: 'Product not found' });
    res.render('admin/product-form', { pageTitle: 'Edit Product', product });
  } catch (err) { next(err); }
});

router.post('/products/:id/edit', async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, productData(req.body), { runValidators: true });
    req.session.flash = { type: 'success', message: 'Product updated.' };
    res.redirect('/admin/products');
  } catch (err) { next(err); }
});

router.post('/products/:id/delete', async (req, res, next) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    req.session.flash = { type: 'success', message: 'Product hidden from the store.' };
    res.redirect('/admin/products');
  } catch (err) { next(err); }
});

router.get('/orders', async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('admin/orders', { pageTitle: 'Manage Orders', orders });
  } catch (err) { next(err); }
});

router.post('/orders/:id/status', async (req, res, next) => {
  try {
    const allowed = ['new', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(req.body.status)) {
      req.session.flash = { type: 'error', message: 'Invalid order status.' };
      return res.redirect('/admin/orders');
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).render('404', { pageTitle: 'Order not found' });
    if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
      }
    }
    order.status = req.body.status;
    await order.save();
    req.session.flash = { type: 'success', message: 'Order status updated.' };
    res.redirect('/admin/orders');
  } catch (err) { next(err); }
});

function productData(body) {
  const title = String(body.title || '').trim();
  const slug = String(body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).trim().toLowerCase();
  return {
    title, slug,
    description: String(body.description || '').trim(),
    price: Number(body.price),
    stock: Number(body.stock),
    category: String(body.category || 'Signature Soaps').trim(),
    weight: String(body.weight || '100 g').trim(),
    image: String(body.image || '/images/soap-rose.svg').trim(),
    featured: body.featured === 'on',
    isActive: body.isActive !== 'off'
  };
}

module.exports = router;
