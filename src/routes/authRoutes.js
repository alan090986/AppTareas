

import { Router } from 'express';
import {
  registrarUsuario,
  loginUsuario,
  verificarToken
} from '../controllers/authController.js';

const router = Router();

router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);
router.get('/verify', verificarToken);

export default router;
