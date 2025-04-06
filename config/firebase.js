const admin = require("firebase-admin");

// Khởi tạo Firebase bằng service account
const serviceAccount = require("./firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://test-7b6bf-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

module.exports = db;
