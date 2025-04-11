const { default: mongoose } = require('mongoose');
const { Status } = require('../utils/constants');
const UserDeviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Device',
      required: true,
    },
    status: {
      type: Number,
      enum: [Status.PENDING, Status.APPROVED],
      default: Status.PENDING,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserDeviceModel = mongoose.model(
  'UserDevice',
  UserDeviceSchema,
  'user_devices'
);
module.exports = UserDeviceModel;
