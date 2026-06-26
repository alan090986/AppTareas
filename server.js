import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tareaRoutes from './routes/tareaRoutes.js';

// 1. Cargar variables de entorno
dotenv.config();

const app = express();

// 2. Definir orígenes permitidos para el Frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://apptareas-oxyp.onrender.com'
];

// 3. Configurar CORS (Debe ir ARRIBA de las rutas)
app.use(cors({
  origin: '*', // Permite que cualquier dominio (como tu Vercel) consuma tu API
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Interceptor manual para solicitudes Preflight (OPTIONS)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// 5. Middleware para leer el cuerpo JSON (Esencial para req.body)
app.use(express.json());

// 6. Definición de las Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/tareas', tareaRoutes);

// 7. Declaración ÚNICA del Puerto y Encendido del Servidor
const PORT = 5001; 
//127.0.0.1
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor backend levantado con éxito en el puerto ${PORT}`);
});
