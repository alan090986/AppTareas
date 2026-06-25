import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const protegerRuta = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 💡 CORRECCIÓN 3FN: Traemos los datos del usuario junto con el texto de su rol ('admin' o 'staff')
    const [result] = await pool.query(
      `SELECT u.*, r.rol 
       FROM users u 
       INNER JOIN roles r ON u.rol_id = r.id 
       WHERE u.id = ?`, 
      [decoded.id]
    );

    if (result.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    // 💡 Ahora req.usuario contendrá de forma nativa req.usuario.rol ('admin' o 'staff')
    req.usuario = result[0];
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};




/*import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const protegerRuta = async (req, res, next) => {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [result] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (result.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.usuario = result[0];
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};*/
