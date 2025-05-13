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
router.get('/forgot-password', authController.renderForgotPasswordPage);
router.post('/forgot-password', authController.forgotPassword);
router.post('/confirm-otp', authController.confirmOtp);
router.post('/change-password', authController.changePassword);

router.post('/register', checkLogin, authController.register);
router.get('/logout', authController.logout);

module.exports = router;
