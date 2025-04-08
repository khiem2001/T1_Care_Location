const express = require('express');
const router = express.Router();

const { requireLogin } = require('../middlewares/authMiddlewares');
const { mapController } = require('../controllers');

router.get('/map', requireLogin, mapController.renderMapPage);

module.exports = router;
