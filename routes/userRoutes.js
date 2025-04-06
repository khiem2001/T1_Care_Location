const express = require('express');
const router = express.Router();

const { userController } = require('../controllers');
const { requireLogin, checkAdmin } = require('../middlewares/authMiddlewares');

// router.get('/profile', requireLogin, userController.renderProfilePage);
// router.post('/profile', requireLogin, userController.updateProfile);
// /**
//  * Bảng điều khiển quản trị viên
//  */
router.get('/admin', checkAdmin, userController.renderDashboardPage);

// /**
//  * Quản lý người dùng
//  */
// router.get('/admin/users', checkAdmin, userController.renderUserPage);
// router.get('/admin/users/add', checkAdmin, userController.renderAddUserPage);
// router.post('/admin/users/add', checkAdmin, userController.create);
// router.get(
//   '/admin/users/edit/:id',
//   checkAdmin,
//   userController.renderEditUserPage
// );
// router.put('/admin/users/edit/:id', checkAdmin, userController.edit);
// router.delete('/admin/users/delete/:id', checkAdmin, userController.del);
module.exports = router;
