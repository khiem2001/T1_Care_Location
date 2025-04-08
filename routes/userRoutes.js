const express = require('express');
const router = express.Router();

const { userController } = require('../controllers');
const { requireLogin, checkAdmin } = require('../middlewares/authMiddlewares');

// router.get('/profile', requireLogin, userController.renderProfilePage);
// router.post('/profile', requireLogin, userController.updateProfile);
// /**
//  * Bảng điều khiển quản trị viên
//  */
router.get('/overview', checkAdmin, userController.renderDashboardPage);

// /**
//  * Quản lý người dùng
//  */
router.get('/users', checkAdmin, userController.renderUserPage);
router.get('/users-add', checkAdmin, userController.renderAddUserPage);
router.post('/users-add', checkAdmin, userController.create);
router.get('/users-edit/:id', checkAdmin, userController.renderEditUserPage);
router.put('/users-edit/:id', checkAdmin, userController.edit);
router.delete('/users-delete/:id', checkAdmin, userController.del);
module.exports = router;
