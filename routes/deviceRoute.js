const express = require('express');
const router = express.Router();

const { requireLogin, checkAdmin } = require('../middlewares/authMiddlewares');
const { deviceController } = require('../controllers');

router.get('/devices', requireLogin, deviceController.renderDevicePage);
router.post('/devices', requireLogin, deviceController.createRequest);
router.get('/requests', checkAdmin, deviceController.renderRequestPage);
router.post('/requests', checkAdmin, deviceController.modifyRequest);

module.exports = router;
