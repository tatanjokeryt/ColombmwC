const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Procesar recarga
router.post('/recharge', async (req, res) => {
    const { amount, method } = req.body;
    const userId = req.user.id;

    try {
        await pool.query('BEGIN');

        // Registrar la transacción
        await pool.query(
            `INSERT INTO transactions 
            (user_id, type, amount, payment_method, description) 
            VALUES ($1, 'recharge', $2, $3, $4)`,
            [userId, amount, method, `Recarga via ${method}`]
        );

        // Actualizar el saldo del usuario
        await pool.query(
            'UPDATE users SET balance = balance + $1 WHERE id = $2',
            [amount, userId]
        );

        await pool.query('COMMIT');
        res.json({ 
            message: 'Recarga exitosa',
            amount,
            method
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error en la recarga:', error);
        res.status(500).json({ message: 'Error al procesar la recarga' });
    }
});

// Procesar retiro
router.post('/withdraw', async (req, res) => {
    const { amount, method } = req.body;
    const userId = req.user.id;
    const MIN_WITHDRAWAL = 50; // Monto mínimo de retiro

    try {
        await pool.query('BEGIN');

        // Verificar monto mínimo
        if (amount < MIN_WITHDRAWAL) {
            throw new Error(`El monto mínimo de retiro es $${MIN_WITHDRAWAL}`);
        }

        // Verificar saldo suficiente
        const userResult = await pool.query(
            'SELECT balance FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows[0].balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        // Registrar la transacción
        await pool.query(
            `INSERT INTO transactions 
            (user_id, type, amount, payment_method, description) 
            VALUES ($1, 'withdraw', $2, $3, $4)`,
            [userId, amount, method, `Retiro via ${method}`]
        );

        // Actualizar el saldo del usuario
        await pool.query(
            'UPDATE users SET balance = balance - $1 WHERE id = $2',
            [amount, userId]
        );

        await pool.query('COMMIT');
        res.json({ 
            message: 'Retiro exitoso',
            amount,
            method
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error en el retiro:', error);
        res.status(400).json({ message: error.message });
    }
});

// Obtener historial de transacciones
router.get('/history', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const transactions = await pool.query(
            `SELECT * FROM transactions 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );

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
        console.error('Error al obtener historial:', error);
        res.status(500).json({ message: 'Error al obtener historial' });
    }
});

module.exports = router; 