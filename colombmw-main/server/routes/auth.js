const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/register', async (req, res) => {
    const { phone_number, password, invitation_code } = req.body;

    try {
        const existingUser = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
        }

        const result = await pool.query('INSERT INTO users (phone_number, password, invitation_code) VALUES ($1, $2, $3) RETURNING *', [phone_number, password, invitation_code]);
        
        res.status(201).json({ message: 'Registro exitoso', user: result.rows[0] });
    } catch (error) {
        console.error('Error en el registro:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

router.post('/login', async (req, res) => {
    const { phone_number, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Número de teléfono o contraseña incorrectos' });
        }

        const user = result.rows[0];

        if (user.password !== password) {
            return res.status(401).json({ message: 'Número de teléfono o contraseña incorrectos' });
        }

        res.json({ token: 'tu_token_aqui', user });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router;
