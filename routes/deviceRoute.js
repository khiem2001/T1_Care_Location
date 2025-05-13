const express = require('express');
const router = express.Router();

const { requireLogin, checkAdmin } = require('../middlewares/authMiddlewares');
const { deviceController } = require('../controllers');

router.get('/devices', requireLogin, deviceController.renderDevicePage);
router.post('/devices', requireLogin, deviceController.createRequest);
router.post(
  '/devices/secretKey',
  requireLogin,
  deviceController.createDeviceWithSecretKey
);

router.post(
  '/devices/update-nickname',
  requireLogin,
  deviceController.updateNickname
);

router.get(
  '/devices-management',
  checkAdmin,
  deviceController.renderDeviceManagementPage
);
router.put(
  '/devices-management/:id',
  checkAdmin,
  deviceController.managementRequest
);
router.get('/requests', checkAdmin, deviceController.renderRequestPage);
router.post('/requests', checkAdmin, deviceController.modifyRequest);

module.exports = router;
