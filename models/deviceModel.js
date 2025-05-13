const { default: mongoose } = require('mongoose');

const DeviceSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
    preStatus: { type: Number, required: true, enum: [0, 1, 2] },
    secretKey: {
      type: String,
      required: true,
    },
    locations: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const DeviceModel = mongoose.model('Device', DeviceSchema, 'devices');
module.exports = DeviceModel;
