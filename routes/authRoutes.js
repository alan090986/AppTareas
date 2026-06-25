  import express from 'express';
  import { 
    registrarUsuario, 
    loginUsuario, 
    verificarToken, 
    obtenerStaff // función del controlador
    
  } from '../controllers/authController.js';
  import { protegerRuta } from '../middleware/authMiddleware.js';

  const router = express.Router();

  router.post('/register', registrarUsuario);
  router.post('/login', loginUsuario);
  router.get('/verify', protegerRuta, verificarToken);

  // ruta protegida para listar a los empleados asignables (3FN)
  router.get('/usuarios', protegerRuta, obtenerStaff);
 


  export default router;
