const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/data', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT users.*, vip_subscriptions.* FROM users LEFT JOIN vip_subscriptions ON users.id = vip_subscriptions.user_id WHERE users.id = $1',
            [req.user.id]
        );

        const userData = {
            ...result.rows[0],
            password: undefined // No enviar la contraseña al cliente
        };

        res.json(userData);
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error al obtener datos del usuario' });
    }
});

module.exports = router;