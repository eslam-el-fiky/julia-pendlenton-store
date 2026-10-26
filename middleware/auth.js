exports.requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.session.flash = { type: 'error', message: 'Please sign in to continue.' };
    return res.redirect('/auth/login');
  }
  next();
};

exports.requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).render('403', { pageTitle: 'Access denied' });
  }
  next();
};
