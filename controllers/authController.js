const { sendMail, sendMessage } = require('../listener/firebaseListener');
const { UserModel } = require('../models');
const OtpModel = require('../models/OtpModel');
const { ROLES } = require('../utils/constants');
const { hashPassword, comparePassword } = require('../utils/password');

const renderLoginPage = (req, res) => {
  res.render('login', { data: {} });
};
const renderRegisterPage = (req, res) => {
  res.render('register', { data: {} });
};
const renderForgotPasswordPage = (req, res) => {
  res.render('forgot-password', { data: {} });
};

const postLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    //Validate
    if (!phone) throw new Error('Tài khoản không được để trống !');
    if (!password) throw new Error('Mật khẩu không được để trống !');

    //Check user
    const user = await UserModel.findOne({
      phone,
    });
    if (!user) throw new Error('Không tìm thấy tài khoản !');

    // Kiểm tra mật khẩu
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      throw new Error('Mật khẩu không chính xác!');
    }
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
    };
    if (user.role === ROLES.ADMIN) {
      return res.redirect('/overview');
    }
    return res.redirect('/map');
  } catch (err) {
    res.render('login', { data: { error: err.message } });
  }
};
const forgotPassword = async (req, res) => {
  const { phone } = req.body;

  try {
    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(404).send('Số điện thoại không tồn tại');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // Lưu hoặc cập nhật OTP
    await OtpModel.findOneAndUpdate(
      { phone },
      { otp, expiresAt },
      { upsert: true, new: true }
    );

    sendMail(user.email, 'Mã xác thực', otp);
    sendMessage(user.phone, otp);
    return res.status(200).json({
      success: true,
      message: 'Đã gửi OTP đến số điện thoại',
      data: { phone },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};
const confirmOtp = async (req, res) => {
  const { phone, otp } = req.body;

  try {
    const record = await OtpModel.findOne({ phone });

    if (!record) {
      return res.status(400).send('Chưa gửi OTP cho số điện thoại này');
    }

    if (record.expiresAt < Date.now()) {
      return res.status(400).send('Mã OTP đã hết hạn');
    }

    if (record.otp !== otp) {
      return res.status(400).send('Mã OTP không chính xác');
    }

    req.session.verifiedPhone = phone;

    return res.status(200).json({
      success: true,
      message: 'Xác nhận OTP thành công',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

const changePassword = async (req, res) => {
  const { phone, newPassword, confirmPassword } = req.body;

  try {
    if (!req.session.verifiedPhone || req.session.verifiedPhone !== phone) {
      return res.status(400).send('Số điện thoại chưa xác thực OTP');
    }

    if (!newPassword || !confirmPassword) {
      return res.status(400).send('Vui lòng nhập đầy đủ mật khẩu');
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send('Mật khẩu xác nhận không khớp');
    }

    const user = await UserModel.findOne({ phone });
    if (!user) {
      return res.status(404).send('Không tìm thấy người dùng');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    await OtpModel.deleteOne({ phone });
    delete req.session.verifiedPhone;

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name) throw new Error('Họ và tên không được để trống!');
    if (!email) throw new Error('Email không được để trống!');
    if (!password) throw new Error('Mật khẩu không được để trống!');
    if (!phone) throw new Error('Số điện thoại không được để trống!');

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) throw new Error('Email đã được sử dụng!');

    const hashedPassword = await hashPassword(password);

    const newUser = new UserModel({
      full_name,
      email,
      password: hashedPassword,
      phone,
      role: ROLES.MEMBER,
    });
    await newUser.save();
    return res.redirect('/login');
  } catch (err) {
    res.render('register', { data: { error: err.message } });
  }
};

const logout = (req, res) => {
  req.session = null;
  // req.session.destroy();
  res.redirect('/login');
};

module.exports = {
  renderLoginPage,
  postLogin,
  logout,
  register,
  renderRegisterPage,
  renderForgotPasswordPage,
  forgotPassword,
  confirmOtp,
  changePassword,
};
