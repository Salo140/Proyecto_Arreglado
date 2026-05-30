const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const citasRoutes = require('./routes/citas');
app.use('/api/citas', citasRoutes);

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de citas funcionando',
    version: '1.0.0',
    endpoints: {
      citas: '/api/citas'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada', ruta: req.originalUrl });
});

module.exports = app;


