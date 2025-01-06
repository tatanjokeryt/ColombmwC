const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authController = {
    async register(req, res) {
        try {
            const { phone_number, password, invitation_code } = req.body;
            
            // Verificar si el usuario ya existe
            const existingUser = await User.findByPhone(phone_number);
            if (existingUser) {
                return res.status(400).json({ message: 'El número ya está registrado' });
            }

            // Encriptar contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Crear usuario
            const user = await User.create({
                phone_number,
                password: hashedPassword,
                invitation_code
            });

            res.status(201).json({ message: 'Usuario registrado exitosamente' });
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor' });
        }
    },

    async login(req, res) {
        try {
            const { phone_number, password } = req.body;
            
            // Buscar usuario
            const user = await User.findByPhone(phone_number);
            if (!user) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Verificar contraseña
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Crear token
            const token = jwt.sign(
                { id: user.id, phone_number: user.phone_number },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({ token, user: {
                phone_number: user.phone_number,
                balance: user.balance
            }});
        } catch (error) {
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
};

module.exports = authController;
