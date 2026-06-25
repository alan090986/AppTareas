import { Router } from 'express';
import { crearTarea, obtenerTareas, actualizarTarea, eliminarTarea, avanzarDepartamento, reportarIncidencia, moverPedidoArea, finalizar} from '../controllers/tareaController.js';
import { protegerRuta } from '../middleware/authMiddleware.js';
const router = Router();

// Rutas protegidas
router.post('/add-task', protegerRuta, crearTarea);
router.get('/tasks', protegerRuta, obtenerTareas);
router.put('/edit-task/:id', protegerRuta, actualizarTarea);
router.delete('/delete-task/:id', protegerRuta, eliminarTarea);
// Rutas para el flujo de producción de muebles
router.put('/:id/avanzar', protegerRuta, avanzarDepartamento);
router.post('/:id/incidencia', protegerRuta, reportarIncidencia);
router.put('/:id/mover-area', protegerRuta, moverPedidoArea);
router.put('/:id/finalizar', protegerRuta, finalizar);


export default router;





