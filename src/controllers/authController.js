// backend/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db'); // conexión a MySQL

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_super_seguro';

// Registrar nuevo usuario
exports.registerUsuario = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Verificar si ya existe el usuario
    const [existingUser] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario en la base de datos
    await db.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
      name,
      email,
      hashedPassword
    ]);

    res.status(201).json({ message: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};


// Login de usuario
exports.loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [userResult] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = userResult[0];

    if (!user) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Credenciales incorrectas' });
    }

    // Crear token
    const token = jwt.sign({ userId: user.id, name: user.name }, SECRET_KEY, { expiresIn: '2h' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Dentro de tu authController.js
export const verificarToken = async (req, res) => {
  try {
    // El middleware 'protegerRuta' debe inyectar el ID en 'req.usuarioId'
    const [result] = await pool.query('SELECT id, nombre, email FROM users WHERE id = ?', [req.usuarioId]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Devolvemos los datos del usuario logueado en texto plano
    res.json({ usuario: result[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};
