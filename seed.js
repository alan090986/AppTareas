import bcrypt from 'bcrypt';
import { pool } from './db.js';

async function seedUser() {
  const nombre = 'Usuario Prueba';
  const email = 'prueba@email.com';
  const passwordPlano = '123456';

  try {
    const hashedPassword = await bcrypt.hash(passwordPlano, 10);

    const [rows] = await pool.query(
      'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    console.log('Usuario insertado con ID:', rows.insertId);
    process.exit(0); // Cierra el proceso correctamente
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log('⚠️ El usuario ya existe');
    } else {
      console.error('❌ Error al insertar usuario:', error);
    }
    process.exit(1); // Cierra el proceso con error
  }
}

seedUser();
