const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { checkLogin } = require('../middlewares/authMiddlewares');

router.get('/', (req, res) => {
  res.redirect('/login');
});

router.get('/login', checkLogin, authController.renderLoginPage);
router.post('/login', checkLogin, authController.postLogin);
router.get('/register', checkLogin, authController.renderRegisterPage);

router.post('/register', checkLogin, authController.register);
router.get('/logout', authController.logout);

module.exports = router;
