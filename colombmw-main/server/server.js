const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./server/routes/auth');
const userRoutes = require('./server/routes/user');
const transactionRoutes = require('./server/routes/transactions');
const vipRoutes = require('./server/routes/vip');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'server')));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/vip', vipRoutes);

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'server/views/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'server/views/dashboard.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Error en el servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});