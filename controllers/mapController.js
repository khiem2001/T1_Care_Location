const { DeviceModel, UserDeviceModel } = require('../models');
const { ROLES } = require('../utils/constants');

const renderMapPage = async (req, res) => {
  try {
    const { user } = req.session;
    let devices = await DeviceModel.find({});

    if (user.role !== ROLES.ADMIN) {
      const userDevices = await UserDeviceModel.find({ userId: user.id })
        .populate('deviceId', 'code')
        .exec();

      const codes = userDevices.map((userDevice) => userDevice.deviceId.code);
      devices = devices.filter((de) => codes.includes(de.code));
    }

    res.render('map', {
      user,
      devices,
    });
  } catch (error) {
    console.log('🚀 ~ renderMapPage ~ error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  renderMapPage,
};
