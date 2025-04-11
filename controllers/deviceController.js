const { DeviceModel, UserDeviceModel } = require('../models');
const { Status } = require('../utils/constants');
const renderDevicePage = async (req, res) => {
  try {
    const userDevices = await UserDeviceModel.find({
      userId: req.session.user.id,
    });
    const ids = userDevices?.map((item) => item.deviceId);
    const devices = await DeviceModel.find({ _id: { $nin: ids } });

    res.render('devices', { devices, user: req.session.user });
  } catch (error) {
    console.log('🚀 ~ renderUserPage ~ error:', error);
    res.status(500).send('Lỗi server');
  }
};

const renderRequestPage = async (req, res) => {
  try {
    const userDevices = await UserDeviceModel.find({ status: Status.PENDING })
      .populate('userId')
      .populate('deviceId');

    const grouped = {};

    userDevices.forEach((ud) => {
      const userId = ud.userId._id.toString();

      if (!grouped[userId]) {
        grouped[userId] = {
          user: ud.userId,
          devices: [],
        };
      }

      grouped[userId].devices.push(ud.deviceId);
    });

    // 3. Chuyển object thành array để render
    const result = Object.values(grouped);

    res.render('admin/devices', {
      userDevices: result,
      user: req.session.user,
    });
  } catch (error) {
    console.log('🚀 ~ renderRequestPage ~ error:', error);
    res.status(500).send('Lỗi server');
  }
};
const createRequest = async (req, res) => {
  try {
    const { deviceIds } = req.body;

    // Check if deviceIds is provided and is an array
    if (!deviceIds || !Array.isArray(deviceIds)) {
      return res
        .status(400)
        .json({ message: 'Danh sách thiết bị không hợp lệ.' });
    }

    const userId = req.session.user.id;

    // Tạo các thao tác bulkWrite với upsert
    const bulkOps = deviceIds.map((deviceId) => ({
      updateOne: {
        filter: { userId, deviceId },
        update: { $set: { status: Status.PENDING } },
        upsert: true,
      },
    }));

    // Thực hiện bulkWrite
    await UserDeviceModel.bulkWrite(bulkOps);
    const userDevices = await UserDeviceModel.find({
      userId: req.session.user.id,
    });
    const ids = userDevices?.map((item) => item.deviceId);
    const devices = await DeviceModel.find({ _id: { $nin: ids } });
    res.render('devices', { devices, user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu theo dõi.' });
  }
};

const modifyRequest = async (req, res) => {
  try {
    const { userId, deviceId, status } = req.body;
    console.log('🚀 ~ modifyRequest ~ userId:', userId);

    if (
      !userId ||
      !deviceId ||
      ![Status.PENDING, Status.APPROVED].includes(Number(status))
    ) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }

    if (Number(status) === Status.APPROVED) {
      const result = await UserDeviceModel.findOneAndUpdate(
        { userId, deviceId },
        { status: Status.APPROVED },
        { new: true }
      );

      if (!result) {
        return res
          .status(404)
          .json({ message: 'Không tìm thấy yêu cầu để duyệt.' });
      }

      return res
        .status(200)
        .json({ message: 'Yêu cầu đã được duyệt.', data: result });
    } else {
      // ❌ Nếu là từ chối: xóa bản ghi
      const result = await UserDeviceModel.findOneAndDelete({
        userId,
        deviceId,
      });

      if (!result) {
        return res
          .status(404)
          .json({ message: 'Không tìm thấy yêu cầu để từ chối.' });
      }

      return res
        .status(200)
        .json({ message: 'Yêu cầu đã bị từ chối và xóa khỏi hệ thống.' });
    }
  } catch (error) {
    console.error('🚀 ~ modifyRequest ~ error:', error);
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

module.exports = {
  renderDevicePage,
  createRequest,
  renderRequestPage,
  modifyRequest,
};
