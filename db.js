import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

// Ejecuta dotenv  en local
dotenv.config();

//  inyecta las credenciales directo.
export const pool = createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'app_tareas',
  port: parseInt(process.env.DB_PORT) || 3307,
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0
});
