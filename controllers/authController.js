import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { pool } from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

// 1. Registrar nuevo usuario
export const registrarUsuario = async (req, res) => {
  const { nombre, email, password } = req.body;

  try {
    const [existe] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existe.length > 0) {
      return res.status(400).json({ message: 'El usuario ya está registrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)', [
      nombre,
      email,
      hashedPassword,
    ]);
    res.status(201).json({ message: 'Usuario registrado correctamente.' });
  } catch (error) {
    console.error('Error al registrar:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// 2. Login de usuario con soporte para Roles (3FN)
export const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // INNER JOIN para extraer el nombre del rol desde la tabla independiente roles
    const [result] = await pool.query(
      `SELECT u.*, r.rol 
       FROM users u 
       INNER JOIN roles r ON u.rol_id = r.id 
       WHERE u.email = ?`, 
      [email]
    );

    if (result.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // 💡 CORRECCIÓN CRUCIAL: Extraemos el primer registro del arreglo de MySQL ([0])
    const usuario = result[0]; 
    const validPassword = await bcrypt.compare(password, usuario.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    // Firmamos el token de forma directa aquí adentro resguardando los datos
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      usuario: { 
        id: usuario.id, 
        nombre: usuario.nombre, 
        email: usuario.email,
        rol: usuario.rol
      } 
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

  

// 3. Verificar token para que las rutas no truenen
export const verificarToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Token válido', id: decoded.id, rol: decoded.rol });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};

// 4. Obtener lista de usuarios con rol Staff (rol_id = 2)
export const obtenerStaff = async (req, res) => {
  try {
    // 💡 El middleware inyecta los datos de users. Evaluamos si el rol_id es DIFERENTE de 1 (Admin)
    // Esto impide de forma rígida que cualquier empleado con rol_id = 2 robe la información
    if (req.usuario.rol_id !== 1) {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de Administrador.' });
    }

    // Si pasa el filtro, la base de datos entrega únicamente el ID y nombre del Staff
    const [empleados] = await pool.query(
      'SELECT id, nombre FROM users WHERE rol_id = 2'
    );

    res.json(empleados);
  } catch (error) {
    console.error('Error al obtener el staff:', error);
    res.status(500).json({ message: 'Error al consultar el equipo en el servidor.' });
  }
};

// Login de usuario
/*export const loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [result] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (result.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const usuario = result[0];
    const validPassword = await bcrypt.compare(password, usuario.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = generarToken(usuario.id);
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email } });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Verificar token
export const verificarToken = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ message: 'Token válido', id: decoded.id });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};*/

