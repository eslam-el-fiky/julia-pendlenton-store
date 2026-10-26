const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.get('/login', (req, res) => res.render('account/login', { pageTitle: 'Sign in' }));
router.post('/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      req.session.flash = { type: 'error', message: 'Email or password is incorrect.' };
      return res.redirect('/auth/login');
    }
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    res.redirect(user.role === 'admin' ? '/admin' : '/');
  } catch (err) { next(err); }
});

router.get('/register', (req, res) => res.render('account/register', { pageTitle: 'Create account' }));
router.post('/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || password.length < 8) {
      req.session.flash = { type: 'error', message: 'Enter your name, a valid email, and a password of at least 8 characters.' };
      return res.redirect('/auth/register');
    }
    if (await User.findOne({ email })) {
      req.session.flash = { type: 'error', message: 'An account with this email already exists.' };
      return res.redirect('/auth/register');
    }
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    req.session.user = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
    res.redirect('/');
  } catch (err) { next(err); }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

module.exports = router;
