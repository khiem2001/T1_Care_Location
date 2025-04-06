const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

//Hàm băm mật khẩu
const hashPassword = async (password) => {
  if (!password) throw new Error('Mật khẩu không được để trống!');
  return await bcrypt.hash(password, SALT_ROUNDS);
};

//Hàm kiểm tra mật khẩu có khớp với hash không
const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};
