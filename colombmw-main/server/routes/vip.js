const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const cron = require('node-cron');

const VIP_PLANS = {
    basic: { price: 100, dailyIncome: 15, duration: 10 },
    premium: { price: 300, dailyIncome: 50, duration: 10 },
    elite: { price: 500, dailyIncome: 100, duration: 10 }
};

// Comprar VIP
router.post('/purchase', async (req, res) => {
    const { type } = req.body;
    const userId = req.user.id;

    if (!VIP_PLANS[type]) {
        return res.status(400).json({ message: 'Plan VIP inválido' });
    }

    const plan = VIP_PLANS[type];

    try {
        await pool.query('BEGIN');

        // Verificar saldo suficiente
        const userResult = await pool.query(
            'SELECT balance FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows[0].balance < plan.price) {
            throw new Error('Saldo insuficiente');
        }

        // Verificar si ya tiene un VIP activo
        const activeVipResult = await pool.query(
            'SELECT * FROM vip_subscriptions WHERE user_id = $1 AND active = true',
            [userId]
        );

        if (activeVipResult.rows.length > 0) {
            throw new Error('Ya tienes un VIP activo');
        }

        // Registrar la suscripción VIP
        await pool.query(
            `INSERT INTO vip_subscriptions 
            (user_id, type, daily_income, days_remaining, active) 
            VALUES ($1, $2, $3, $4, true)`,
            [userId, type, plan.dailyIncome, plan.duration]
        );

        // Registrar la transacción de compra
        await pool.query(
            `INSERT INTO transactions 
            (user_id, type, amount, description) 
            VALUES ($1, 'vip_purchase', $2, $3)`,
            [userId, plan.price, `Compra de VIP ${type.toUpperCase()}`]
        );

        // Actualizar el saldo del usuario
        await pool.query(
            'UPDATE users SET balance = balance - $1 WHERE id = $2',
            [plan.price, userId]
        );

        await pool.query('COMMIT');
        res.json({ 
            message: 'Compra de VIP exitosa',
            plan: type,
            dailyIncome: plan.dailyIncome,
            daysRemaining: plan.duration
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error en la compra de VIP:', error);
        res.status(400).json({ message: error.message });
    }
});

// Obtener estado del VIP
router.get('/status', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM vip_subscriptions 
            WHERE user_id = $1 AND active = true`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.json({ active: false });
        }

        res.json({
            active: true,
            ...result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener estado VIP:', error);
        res.status(500).json({ message: 'Error al obtener estado VIP' });
    }
});

// Procesar ingresos diarios (ejecutar con cron)
async function processVIPIncome() {
    try {
        const activeVips = await pool.query(
            `SELECT * FROM vip_subscriptions WHERE active = true`
        );

        for (const vip of activeVips.rows) {
            await pool.query('BEGIN');

            // Agregar ingreso diario
            await pool.query(
                `UPDATE users SET balance = balance + $1 WHERE id = $2`,
                [vip.daily_income, vip.user_id]
            );

            // Registrar la transacción
            await pool.query(
                `INSERT INTO transactions (user_id, type, amount, description)
                VALUES ($1, 'vip_income', $2, $3)`,
                [vip.user_id, vip.daily_income, `Ingreso diario VIP ${vip.type.toUpperCase()}`]
            );

            // Actualizar días restantes
            await pool.query(
                `UPDATE vip_subscriptions 
                SET days_remaining = days_remaining - 1
                WHERE id = $1`,
                [vip.id]
            );

            // Desactivar VIP si se acabaron los días
            if (vip.days_remaining <= 1) {
                await pool.query(
                    `UPDATE vip_subscriptions SET active = false WHERE id = $1`,
                    [vip.id]
                );
            }

            await pool.query('COMMIT');
        }
    } catch (error) {
        console.error('Error al procesar ingresos VIP:', error);
        await pool.query('ROLLBACK');
    }
}

// Configurar cron job para procesar ingresos diarios
cron.schedule('0 0 * * *', () => {
    processVIPIncome();
});

module.exports = router;