const { DeviceModel, UserDeviceModel } = require('../models');
const { ROLES } = require('../utils/constants');
const { Status } = require('../utils/constants');

const renderMapPage = async (req, res) => {
  try {
    const { user } = req.session;
    let devices = await DeviceModel.find({});

    if (user.role !== ROLES.ADMIN) {
      const userDevices = await UserDeviceModel.find({
        userId: user.id,
        status: Status.APPROVED,
      })
        .populate('deviceId', 'code')
        .exec();

      const codes = userDevices.map((userDevice) => userDevice.deviceId.code);
      devices = devices.filter((de) => codes.includes(de.code));
      devices = await Promise.all(
        devices.map(async (device) => {
          const deviceJSON = device.toJSON ? device.toJSON() : device;
          const { nickname } =
            userDevices.find((item) => item.deviceId.code === device.code) ||
            {};

          deviceJSON.nickname = nickname || '';

          return deviceJSON;
        })
      );
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
