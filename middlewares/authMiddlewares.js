const { ROLES } = require('../utils/constants');

const checkLogin = (req, res, next) => {
  // if (req.session.user) {
  //   if (req.session.user.role == ROLES.ADMIN) {
  //     return res.redirect('/admin');
  //   }
  //   return res.redirect('/map');
  // }
  next();
};
const checkAdmin = (req, res, next) => {
  const isAdmin = req.session?.user?.role == ROLES.ADMIN;
  if (!isAdmin) {
    return res.redirect('/login');
  }
  next();
};

const requireLogin = (req, res, next) => {
  if (!req.session?.user) {
    return res.redirect('/login');
  }
  next();
};

module.exports = {
  checkLogin,
  checkAdmin,
  requireLogin,
};
