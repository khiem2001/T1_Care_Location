const { DeviceModel, UserDeviceModel } = require('../models');
const { Status } = require('../utils/constants');
const { updateFirebaseData } = require('./firebaseController');
const renderDevicePage = async (req, res) => {
  try {
    const status = req.query.status || 'unfollowed';
    const userId = req.session.user.id;

    // Lấy tất cả các deviceId mà user đã theo dõi
    const userDevices = await UserDeviceModel.find({ userId });
    const followedDeviceIds = userDevices.map((item) => item.deviceId);

    let devices = [];

    if (status === 'followed') {
      devices = await DeviceModel.find({ _id: { $in: followedDeviceIds } });
      devices = await Promise.all(
        devices.map(async (device) => {
          const { nickname } =
            userDevices.find(
              (item) => item.deviceId.toString() === device._id.toString()
            ) || {};
          console.log('🚀 ~ devices.map ~ nickname:', nickname);
          device.nickname = nickname || '';
          return device;
        })
      );
    } else {
      devices = await DeviceModel.find({ _id: { $nin: followedDeviceIds } });
    }

    res.render('devices', {
      devices,
      user: req.session.user,
      status,
    });
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};

const renderDeviceManagementPage = async (req, res) => {
  try {
    const { search = '', role = '', page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
      ];
    }

    const totalDevices = await DeviceModel.countDocuments(query);
    const totalPages = Math.ceil(totalDevices / limit);
    const devices = await DeviceModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'user_devices',
          localField: '_id',
          foreignField: 'deviceId',
          as: 'userDeviceRefs',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userDeviceRefs.userId',
          foreignField: '_id',
          as: 'users',
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          code: 1,
          name: 1,
          secretKey: 1,
          preStatus: 1,
          locations: 1,
          createdAt: 1,
          users: {
            _id: 1,
            full_name: 1,
            email: 1,
            phone: 1,
          },
        },
      },
    ]);

    res.render('admin/devices', {
      devices,
      user: req.session.user,
      totalDevices,
      totalPages,
      currentPage: parseInt(page),
      search,
    });
  } catch (error) {
    console.log('🚀 ~ renderUserPage ~ error:', error);
    res.status(500).send('Lỗi server');
  }
};

const managementRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, secretKey } = req.body;

    if (!id || !name) {
      return res
        .status(400)
        .json({ message: 'Thiếu thông tin thiết bị hoặc tên mới.' });
    }

    // Update the device name
    const updatedDevice = await DeviceModel.updateOne(
      { code: id },
      { $set: { name, secretKey } }
    );
    await updateFirebaseData(id, { name });

    if (!updatedDevice) {
      return res.status(404).json({ message: 'Không tìm thấy thiết bị.' });
    }

    res
      .status(200)
      .json({ message: 'Cập nhật thiết bị thành công.', data: updatedDevice });
  } catch (error) {
    console.error('🚀 ~ managementRequest ~ error:', error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật thiết bị.' });
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

    res.render('admin/requests', {
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

    res.render('devices', {
      devices,
      user: req.session.user,
      status: 'unfollowed',
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu theo dõi.' });
  }
};
const createDeviceWithSecretKey = async (req, res) => {
  try {
    const { deviceId, secretKey } = req.body;

    if (!secretKey) {
      return res
        .status(400)
        .json({ message: 'Mã bí mật không được để trống.' });
    }

    const userId = req.session.user.id;

    const device = await DeviceModel.findById(deviceId);

    if (!device) {
      return res.status(404).json({ message: 'Thiết bị không tồn tại.' });
    }

    if (device.secretKey !== secretKey) {
      return res.status(400).json({ message: 'Mã bí mật không chính xác.' });
    }

    const updateResult = await UserDeviceModel.updateOne(
      { userId, deviceId },
      { $set: { status: Status.APPROVED } },
      { upsert: true }
    );

    const userDevices = await UserDeviceModel.find({
      userId: req.session.user.id,
    });
    const ids = userDevices.map((item) => item.deviceId);

    const devices = await DeviceModel.find({ _id: { $nin: ids } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi tạo yêu cầu theo dõi.' });
  }
};

const updateNickname = async (req, res) => {
  const { deviceId, userId, nickname } = req.body;
  const { id } = req.session.user;
  try {
    const result = await UserDeviceModel.updateOne(
      { deviceId, userId: id },
      { $set: { nickname } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({
        message: 'Không tìm thấy thiết bị của người dùng để cập nhật.',
      });
    }

    res.json({ success: true, message: 'Cập nhật nickname thành công!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi khi cập nhật nickname' });
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
    res.status(500).json({ message: 'Lỗi server.' });
  }
};

const deleteUserDevice = async (req, res) => {
  const { deviceCode, userId } = req.params;
  try {
    const device = await DeviceModel.findOne({ code: deviceCode });
    if (!device)
      return res.status(404).json({ error: 'Thiết bị không tồn tại' });

    await UserDeviceModel.deleteOne({ deviceId: device._id, userId });

    res.status(200).json({ message: 'Xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

module.exports = {
  renderDevicePage,
  createRequest,
  renderRequestPage,
  modifyRequest,
  renderDeviceManagementPage,
  managementRequest,
  updateNickname,
  createDeviceWithSecretKey,
  deleteUserDevice,
};
