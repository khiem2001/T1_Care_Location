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
function generateSecretKey(length = 16) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  hashPassword,
  comparePassword,
  generateSecretKey,
};
