
const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const morgan = require('morgan');

const shopRoutes = require('./routes/shop');
const cartRoutes = require('./routes/cart');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const Product = require('./models/Product');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/laven-store',
  collection: 'sessions'
});
store.on('error', (error) => console.error('Session store error:', error));

app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  store,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7, httpOnly: true, sameSite: 'lax' }
}));

app.use((req, res, next) => {
  res.locals.isAuthenticated = Boolean(req.session.user);
  res.locals.currentUser = req.session.user || null;
  res.locals.isAdmin = req.session.user?.role === 'admin';
  res.locals.cartCount = (req.session.cart || []).reduce((sum, item) => sum + item.quantity, 0);
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', shopRoutes);
app.use('/cart', cartRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => res.status(404).render('404', { pageTitle: 'Page not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('500', { pageTitle: 'Something went wrong' });
});

async function seedProducts() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany([
    { title: 'Rose & Oud', slug: 'rose-oud', description: 'A refined floral soap with a warm, woody finish. A thoughtful addition to a luxury gift box.', price: 160, stock: 20, category: 'Signature Soaps', weight: '100 g', image: '/images/soap-rose.svg', featured: true },
    { title: 'Amber Luxury', slug: 'amber-luxury', description: 'A warm, elegant fragrance presented in a minimal, premium style.', price: 180, stock: 15, category: 'Signature Soaps', weight: '100 g', image: '/images/soap-amber.svg', featured: true },
    { title: 'Olive Botanicals', slug: 'olive-botanicals', description: 'A botanical-inspired bar with a calm, natural look and feel.', price: 140, stock: 25, category: 'Botanical', weight: '100 g', image: '/images/soap-olive.svg', featured: true },
    { title: 'Vanilla Silk', slug: 'vanilla-silk', description: 'A soft, comforting scent in a beautiful everyday luxury bar.', price: 150, stock: 18, category: 'Signature Soaps', weight: '100 g', image: '/images/soap-vanilla.svg', featured: false },
  ]);
  console.log('Sample products added to the database.');
}

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/laven-store')
  .then(async () => {
    console.log('MongoDB connected');
    await seedProducts();
    app.listen(PORT, () => console.log(`Julia Pendlenton Store running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error.message);
    console.error('Check MONGODB_URI in your .env file and make sure MongoDB is running.');
    process.exit(1);
  });
