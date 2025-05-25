const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');

const app = express();
const db = new sqlite3.Database('./logs.db');

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: 'rahasiaadmin',
  resave: false,
  saveUninitialized: true
}));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS device_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT,
    battery TEXT,
    language TEXT,
    ip TEXT,
    userAgent TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

function checkAuth(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/log', (req, res) => {
  const { brand, battery, language, ip, userAgent } = req.body;
  db.run(`INSERT INTO device_logs (brand, battery, language, ip, userAgent) VALUES (?, ?, ?, ?, ?)`,
    [brand, battery, language, ip, userAgent]);
  res.sendStatus(200);
});

app.get('/admin', checkAuth, (req, res) => {
  db.all(`SELECT * FROM device_logs ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) return res.status(500).send('DB Error');
    res.render('admin', { logs: rows });
  });
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'anjay123') {
    req.session.loggedIn = true;
    res.redirect('/admin');
  } else {
    res.send('Login gagal bre. Coba lagi!');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT}`));
