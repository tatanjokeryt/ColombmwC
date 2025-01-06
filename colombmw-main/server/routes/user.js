const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener datos del usuario
router.get('/data', async (req, res) => {
    try {
        // Obtener datos del usuario y su VIP activo si existe
        const result = await pool.query(`
            SELECT 
                u.id,
                u.phone_number,
                u.balance,
                u.invitation_code,
                v.type as vip_type,
                v.daily_income,
                v.days_remaining,
                v.active as vip_active
            FROM users u
            LEFT JOIN vip_subscriptions v ON u.id = v.user_id AND v.active = true
            WHERE u.id = $1
        `, [req.user.id]);

        // Obtener las últimas 5 transacciones
        const transactions = await pool.query(`
            SELECT type, amount, created_at
            FROM transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [req.user.id]);

        // Preparar la respuesta
        const userData = {
            ...result.rows[0],
            transactions: transactions.rows
        };

        res.json(userData);
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        res.status(500).json({ message: 'Error al obtener datos del usuario' });
    }
});

// Actualizar datos del usuario
router.put('/update', async (req, res) => {
    const { phone_number } = req.body;
    
    try {
        // Verificar si el número de teléfono ya está en uso
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE phone_number = $1 AND id != $2',
            [phone_number, req.user.id]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'El número de teléfono ya está en uso' });
        }

        // Actualizar el número de teléfono
        await pool.query(
            'UPDATE users SET phone_number = $1 WHERE id = $2',
            [phone_number, req.user.id]
        );

        res.json({ message: 'Datos actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar datos del usuario:', error);
        res.status(500).json({ message: 'Error al actualizar datos del usuario' });
    }
});

// Obtener estadísticas del usuario
router.get('/stats', async (req, res) => {
    try {
        const stats = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE 
                    WHEN type = 'vip_income' OR type = 'referral_income' 
                    THEN amount ELSE 0 END), 0) as total_earnings,
                COALESCE(SUM(CASE 
                    WHEN type = 'referral_income' 
                    THEN amount ELSE 0 END), 0) as referral_earnings,
                (SELECT COUNT(*) FROM referrals WHERE referrer_id = $1) as active_referrals
            FROM transactions 
            WHERE user_id = $1
        `, [req.user.id]);

        const user = await pool.query(
            'SELECT invitation_code as referral_code FROM users WHERE id = $1',
            [req.user.id]
        );

        res.json({
            ...stats.rows[0],
            referral_code: user.rows[0].referral_code
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ message: 'Error al obtener estadísticas' });
    }
});

// Obtener historial completo de transacciones
router.get('/transactions', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Obtener transacciones paginadas
        const transactions = await pool.query(`
            SELECT type, amount, created_at
            FROM transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `, [req.user.id, limit, offset]);

        // Obtener el total de transacciones para la paginación
        const total = await pool.query(
            'SELECT COUNT(*) FROM transactions WHERE user_id = $1',
            [req.user.id]
        );

        res.json({
            transactions: transactions.rows,
            total: parseInt(total.rows[0].count),
            pages: Math.ceil(total.rows[0].count / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        console.error('Error al obtener historial de transacciones:', error);
        res.status(500).json({ message: 'Error al obtener historial de transacciones' });
    }
});

module.exports = router;
