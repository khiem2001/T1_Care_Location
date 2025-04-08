const dotenv = require('dotenv');
const express = require('express');
const session = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const connectDB = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoute');
const mapRoutes = require('./routes/mapRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(methodOverride('_method'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('trust proxy', 1);

app.use(
  session({
    name: 'session',
    keys: [process.env.SESSION_KEY || 'default_secret'],
    maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true, // Bảo mật chống XSS
  })
);

// design file
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// routers

app.use(userRoutes);
app.use(mapRoutes);
app.use(authRoutes);

// server listening
app.listen(PORT, () => {
  console.log(`The app start on http://localhost:${PORT}`);
});
