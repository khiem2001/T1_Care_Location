const { DeviceModel, UserModel, UserDeviceModel } = require('../models');
const { ROLES } = require('../utils/constants');
const { hashPassword } = require('../utils/password');

//Giao diên
const renderUserPage = async (req, res) => {
  try {
    const { search = '', role = '', page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const totalUsers = await UserModel.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    const users = await UserModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Lấy thông báo từ session
    const message_success = req.session.message_success || null;
    const message_error = req.session.message_error || null;

    // Xóa thông báo sau khi đọc để tránh hiển thị lại
    req.session.message_success = null;
    req.session.message_error = null;

    res.render('admin/users', {
      user: req.session.user,
      users,
      totalPages,
      currentPage: parseInt(page),
      search,
      role,
      message_success,
      message_error,
    });
  } catch (error) {
    console.log('🚀 ~ renderUserPage ~ error:', error);
    res.status(500).send('Lỗi server');
  }
};

const renderAddUserPage = async (req, res) => {
  try {
    const devices = await DeviceModel.find({});
    res.render('admin/users/add', { user: req.session.user, devices });
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};

const renderEditUserPage = async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      throw new Error('Người dùng không tồn tại!');
    }
    const deviceIds = (
      await UserDeviceModel.find({
        userId: user._id,
      })
    ).map((item) => item.deviceId.toString());

    const devices = (await DeviceModel.find({})).map((device) => ({
      ...device.toObject(),
      selected: deviceIds.includes(device._id.toString()),
    }));

    res.render('admin/users/edit', {
      user: req.session.user,
      record: user,
      devices,
    });
  } catch (error) {
    res.status(500).send('Lỗi server');
  }
};

//Api xử lý
const create = async (req, res) => {
  try {
    const {
      user_full,
      user_mail,
      user_pass,
      user_re_pass,
      user_level,
      user_phone,
      device_ids,
    } = req.body;
    if (!user_full) throw new Error('Họ và tên không được để trống!');
    if (!user_mail) throw new Error('Email không được để trống!');
    if (!user_phone) throw new Error('Số điện thoại không được để trống!');
    if (!user_pass) throw new Error('Mật khẩu không được để trống!');
    if (!user_re_pass) throw new Error('Vui lòng nhập lại mật khẩu!');

    if (user_pass !== user_re_pass) {
      throw new Error('Mật khẩu nhập lại không khớp!');
    }

    const existingUser = await UserModel.findOne({ email: user_mail });
    if (existingUser) {
      throw new Error('Email đã tồn tại!');
    }

    const role = user_level == '1' ? ROLES.ADMIN : ROLES.MEMBER;
    const hashedPassword = await hashPassword(user_pass);

    const newUser = new UserModel({
      full_name: user_full,
      email: user_mail,
      password: hashedPassword,
      role,
      phone: user_phone,
    });

    await newUser.save();
    if (device_ids?.length > 0) {
      const userDevices = device_ids.map((deviceId) => ({
        userId: newUser._id,
        deviceId: deviceId,
      }));
      await UserDeviceModel.insertMany(userDevices);
    }
    req.session.message_success = 'Tạo người dùng thành công!';
    return res.redirect('/admin/users');
  } catch (error) {
    console.log('🚀 ~ create ~ error:', error);
    // Chỉ render nếu headers chưa được gửi
    if (!res.headersSent) {
      return res.render('admin/users/add', {
        user: req.session.user,
        error: error.message || 'Lỗi server!',
        devices: await DeviceModel.find({}),
      });
    }
  }
};

const edit = async (req, res) => {
  try {
    const {
      user_full,
      user_mail,
      user_level,
      user_pass,
      user_phone,
      device_ids,
    } = req.body;
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      throw new Error('Người dùng không tồn tại!');
    }
    user.phone = user_phone;
    user.full_name = user_full;
    user.email = user_mail;
    user.role = user_level == '1' ? ROLES.ADMIN : ROLES.MEMBER;

    if (user_pass) user.password = await hashPassword(user_pass);
    await user.save();

    await UserDeviceModel.deleteMany({ userId: user._id });

    if (device_ids?.length > 0) {
      const userDevices = device_ids.map((deviceId) => ({
        userId: user._id,
        deviceId: deviceId,
      }));
      await UserDeviceModel.insertMany(userDevices);
    }
    req.session.message_success = 'Cập nhật người dùng thành công!';

    return res.redirect('/admin/users');
  } catch (error) {
    const deviceIds = (
      await UserDeviceModel.find({
        userId: req.params.id,
      })
    ).map((item) => item.deviceId.toString());

    const devices = (await DeviceModel.find({})).map((device) => ({
      ...device.toObject(),
      selected: deviceIds.includes(device._id.toString()),
    }));

    console.log('🚀 ~ edit ~ error:', error);
    return res.render('admin/users/edit', {
      user: req.session.user,
      record: await UserModel.findById(req.params.id),
      error: error.message || 'Lỗi server!',
      devices,
    });
  }
};

const del = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.session.user.id;
    if (userId === currentUserId) {
      req.session.message_error = 'Bạn không thể xóa chính mình!';
      return res.redirect('/admin/users');
    }
    await UserModel.findByIdAndDelete(userId);
    req.session.message_error = req.session.message_success =
      'Xóa người dùng thành công!';
    return res.redirect('/admin/users');
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Lỗi server');
  }
};

const renderDashboardPage = async (req, res) => {
  try {
    const totalUser = await UserModel.countDocuments();
    const totalDevice = await DeviceModel.countDocuments();
    const user = req.session.user;

    const userStats = await UserModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const data = new Array(12).fill(0);
    userStats.forEach((item) => {
      data[item._id - 1] = item.count;
    });

    res.render('admin', {
      user,
      totalUser,
      totalDevice,
      data: JSON.stringify(data),
    });
  } catch (error) {
    console.log('🚀 ~ renderDashboardPage ~ error:', error);
    res.status(500).send('Lỗi server');
  }
};
const renderProfilePage = async (req, res) => {
  const user = await UserModel.findById(req.session.user.id);
  res.render('profile', { user });
};
const updateProfile = async (req, res) => {
  try {
    const { user_email, user_full_name, user_phone, user_pass } = req.body;
    const user = await UserModel.findById(req.session.user.id);

    user.phone = user_phone;
    user.full_name = user_full_name;
    user.email = user_email;
    if (user_pass) user.password = await hashPassword(user_pass);
    await user.save();
    return res.redirect('/');
  } catch (error) {
    console.log('🚀 ~ updateProfile ~ error:', error);
    res.render('profile', { user: req.session.user });
  }
};

module.exports = {
  renderUserPage,
  renderAddUserPage,
  renderEditUserPage,
  create,
  edit,
  del,
  renderDashboardPage,
  renderProfilePage,
  updateProfile,
};
