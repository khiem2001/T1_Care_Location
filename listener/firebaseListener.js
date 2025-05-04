const databaseFB = require('../config/firebase');
const { DeviceModel, UserDeviceModel } = require('../models');
const { convertDDMMtoDD } = require('../utils/map');
const { Status } = require('../utils/constants');
const nodemailer = require('nodemailer');

const ref = databaseFB.ref('/');
// Lắng nghe khi 1 node con được thêm mới
ref.on('child_added', async (snapshot) => {
  const code = snapshot.key;
  const data = {
    name: snapshot.val().name,
    preStatus: snapshot.val().status,
  };

  await DeviceModel.findOneAndUpdate({ code: code }, data, {
    upsert: true,
    new: true,
  });
});

// Lắng nghe khi 1 node con bị cập nhật
ref.on('child_changed', async (snapshot) => {
  const code = snapshot.key; // Lấy mã người dùng
  const updatedData = snapshot.val(); // Dữ liệu mới

  // Truy vấn từ DeviceModel để lấy trạng thái cũ
  const existingDevice = await DeviceModel.findOne({ code: code });

  if (existingDevice) {
    const oldStatus = existingDevice.preStatus;
    const newStatus = updatedData.status;
    const { latitude, longitude } = updatedData;

    if (
      oldStatus == 0 &&
      (newStatus == 1 || newStatus == 2) &&
      latitude &&
      longitude
    ) {
      const mapLink = `https://www.google.com/maps?q=${convertDDMMtoDD(
        latitude
      )},${convertDDMMtoDD(longitude)}`;

      // Gửi thông báo tới người dùng
      const users = (
        await UserDeviceModel.find({
          deviceId: existingDevice._id,
          status: Status.APPROVED,
        }).populate('userId', 'phone email full_name')
      ).map((item) => item.userId);
      for (const user of users) {
        console.log('🚀 ~ ref.on ~ user:', user.email);
        // Gửi SMS
        // await sendMessage(user.phone, `${mapLink}`);
        // Gửi email
        // await sendMail(
        //   user.email,
        //   'Thông báo thiết bị',
        //   `<p>Thiết bị ${existingDevice.name} đã được bật. Vui lòng kiểm tra tại: <a href="${mapLink}">${mapLink}</a></p>`
        // );
      }
    }
    if (
      existingDevice.name !== updatedData.name ||
      existingDevice.preStatus !== updatedData.status
    ) {
      await DeviceModel.findOneAndUpdate(
        { code: code },
        {
          name: updatedData.name,
          preStatus: updatedData.status,
        },
        { new: true }
      );
      console.log(
        `Đã cập nhật thông tin của người dùng ${updatedData.name} (${code})`
      );
    }
  } else {
    console.log('Không tìm thấy người dùng với code:', code);
  }
});

// Lắng nghe khi 1 node con bị xóa
ref.on('child_removed', async (snapshot) => {
  const code = snapshot.key; // Lấy mã người dùng bị xóa

  await DeviceModel.findOneAndDelete({ code: code });
});

const sendMessage = async (toPhone, messageBody) => {
  try {
    const client = require('twilio')(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const message = await client.messages.create({
      body: 'Tai nạn!',
      from: process.env.TWILIO_FROM_PHONE,
      to: process.env.TWILIO_TO_PHONE,
    });

    console.log('Đã gửi SMS:');
  } catch (error) {
    console.error('Lỗi khi gửi SMS:', error);
  }
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendMail = async (toEmail, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: '"Thông báo ',
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });

    console.log('Email đã được gửi:', info.messageId);
  } catch (error) {
    console.error('Lỗi khi gửi email:', error);
  }
};
