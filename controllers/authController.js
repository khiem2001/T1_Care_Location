const { UserModel } = require('../models');
const { ROLES } = require('../utils/constants');
const { hashPassword, comparePassword } = require('../utils/password');

const renderLoginPage = (req, res) => {
  res.render('login', { data: {} });
};
const renderRegisterPage = (req, res) => {
  res.render('register', { data: {} });
};

const postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    //Validate
    if (!email) throw new Error('Tài khoản không được để trống !');
    if (!password) throw new Error('Mật khẩu không được để trống !');

    //Check user
    const user = await UserModel.findOne({
      email,
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
      return res.redirect('/admin');
    }
    return res.redirect('/map');
  } catch (err) {
    res.render('login', { data: { error: err.message } });
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
};
