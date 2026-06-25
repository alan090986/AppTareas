import { pool } from '../db.js';

// Crear y asignar nueva tarea (3FN con Roles)
export const crearTarea = async (req, res) => {
  // 💡 El frontend ahora puede mandar 'asignadoA' (el ID del empleado elegido por el Admin)
  const { titulo, descripcion, asignadoA } = req.body;
  const { id: usuarioLogueadoId, rol } = req.usuario; 

  try {
    // Si el que crea la tarea es Admin y seleccionó a alguien, usamos ese ID.
    // Si es Staff, forzamos que el usuario_id de la tarea sea su propio ID.
    const usuarioIdFinal = (rol === 'admin' && asignadoA) ? asignadoA : usuarioLogueadoId;

    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, area_id, status_id) VALUES (?, ?, ?, 1, 1)',
      [usuarioIdFinal, titulo, descripcion]
    );
    res.status(201).json({ 
       id: result.insertId, 
      titulo, 
      descripcion, 
      user_id: usuarioIdFinal,
      area_id: 1,
      status_id: 1 
    });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ message: 'Error al crear la tarea' });
  }
};


/* //Crear nueva tarea
export const crearTarea = async (req, res) => {
  const { titulo, descripcion } = req.body;
  const usuarioId = req.usuario.id;

  try {
    const [result] = await pool.query(
      'INSERT INTO tareas (usuario_id, titulo, descripcion) VALUES (?, ?, ?)',
      [usuarioId, titulo, descripcion]
    );
    res.status(201).json({ id: result.insertId, titulo, descripcion });
  } catch (error) {
    console.error('Error al crear tarea:', error);
    res.status(500).json({ message: 'Error al crear la tarea' });
  }
};*/

// Listar tareas del usuario

// 🔄 Obtener tareas filtradas por Rol (3FN)
// GET /api/tareas
export const obtenerTareas = async (req, res) => {
  const { id: usuarioId, rol } = req.usuario;

  try {
    let query;
    let params = [];

    if (rol === 'admin') {
      // El Admin ve todas las áreas activas (IDs del 1 al 5), ignorando las entregadas (ID 6)
      query = `
        SELECT t.id, t.title AS titulo, t.description AS descripcion, t.created_at AS fecha_creacion, 
               u.nombre AS asignado_a, a.name AS area, s.name AS estado_interno, t.area_id, t.status_id
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.id
        INNER JOIN areas_fabrica a ON t.area_id = a.id
        INNER JOIN task_status s ON t.status_id = s.id
        WHERE t.area_id < 6
        ORDER BY t.area_id ASC, t.id DESC
      `;
    } else {
      // El empleado solo ve lo asignado a él que no esté entregado
      query = `
        SELECT t.id, t.title AS titulo, t.description AS descripcion, t.created_at AS fecha_creacion, 
               a.name AS area, s.name AS estado_interno, t.area_id, t.status_id
        FROM tasks t
        INNER JOIN areas_fabrica a ON t.area_id = a.id
        INNER JOIN task_status s ON t.status_id = s.id
        WHERE t.user_id = ? AND t.area_id < 6
        ORDER BY t.id DESC
      `;
      params.push(usuarioId);
    }

    const [tareas] = await pool.query(query, params);
    res.json(tareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cargar el tablero.' });
  }
};



//codigo anterior listar tareas que funciona pero aun le falta revisar el token
/*export const obtenerTareas = async (req, res) => {
  const usuarioId = req.usuario.id;

  try {
    const [tareas] = await pool.query(
      'SELECT * FROM tareas WHERE usuario_id = ? ORDER BY fecha_creacion DESC',
      [usuarioId]
    );
    res.json(tareas);
  } catch (error) {
    console.error('Error al obtener tareas:', error);
    res.status(500).json({ message: 'Error al obtener las tareas' });
  }
};*/

// Actualizar tarea
export const actualizarTarea = async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion } = req.body; // Recibimos el texto desde React

  try {
    // 💡 CORRECCIÓN INTEGRAL 3FN: Apuntamos a la tabla 'tasks', actualizando 'title' y 'description'
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ? WHERE id = ?',
      [titulo, descripcion, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'El pedido no se encontró en el taller.' });
    }

    res.json({ message: 'Pedido actualizado con éxito en la base de datos.', id, titulo, descripcion });
  } catch (error) {
    console.error('❌ Error fatal en MySQL al actualizar la tarea:', error);
    res.status(500).json({ message: 'Error interno en el servidor al actualizar la base de datos.' });
  }
};


// Eliminar tarea
export const eliminarTarea = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.usuario.id;

  try {
    const [resultado] = await pool.query(
      'DELETE FROM tareas WHERE id = ? AND usuario_id = ?',
      [id, usuarioId]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada o no autorizada' });
    }

    res.json({ message: 'Tarea eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar tarea:', error);
    res.status(500).json({ message: 'Error al eliminar la tarea' });
  }
};


// 🚀 Avanzar tarea al siguiente departamento de fabricación
export const avanzarDepartamento = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Consultar el departamento actual de la tarea
    const [tarea] = await pool.query('SELECT departamento_id FROM tareas WHERE id = ?', [id]);
    if (tarea.length === 0) return res.status(404).json({ message: 'Tarea no encontrada' });

    const actualId = tarea[0].departamento_id;

    // 2. Si ya está en el último departamento (id 4: Terminado), no avanza más
    if (actualId >= 4) {
      return res.status(400).json({ message: 'El producto ya está en la fase final de Terminado.' });
    }

    // 3. Avanzar +1 en la línea de producción
    await pool.query('UPDATE tareas SET departamento_id = ? WHERE id = ?', [actualId + 1, id]);
    res.json({ message: 'Producto avanzado con éxito en la línea de producción.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// ⚠️ Registrar una incidencia (falta de material, averías, etc.)
export const reportarIncidencia = async (req, res) => {
  const { id } = req.params;
  const { comentario } = req.body;
  const operarioId = req.usuario.id;

  try {
    await pool.query(
      'INSERT INTO incidencias (tarea_id, operario_id, comentario) VALUES (?, ?, ?)',
      [id, operarioId, comentario]
    );
    res.status(201).json({ message: 'Incidencia reportada con éxito al Administrador.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// 🔄 Mover Pedido de Área (Estilo Trello / Kanban)

export const moverPedidoArea = async (req, res) => {
  const { id } = req.params;
  const { nuevaAreaId, nuevoUsuarioId } = req.body; // 💡 Capturamos el nuevo empleado

  try {
    // Si viene nuevoUsuarioId, actualiza el depto y el empleado. Si no viene, solo cambia el depto.
    const query = nuevoUsuarioId 
      ? 'UPDATE tasks SET area_id = ?, user_id = ?, status_id = 1 WHERE id = ?'
      : 'UPDATE tasks SET area_id = ?, status_id = 1 WHERE id = ?';
      
    const params = nuevoUsuarioId 
      ? [nuevaAreaId, nuevoUsuarioId, id]
      : [nuevaAreaId, id];

    await pool.query(query, params);

    res.json({ message: 'Pedido movido y reasignado con éxito en el taller.' });
  } catch (error) {
    console.error('Error al mover y reasignar:', error);
    res.status(500).json({ message: 'Error interno en el servidor.' });
  }
};



// ✅ ACCIÓN OPERARIO: Actualiza el estatus interno a 'Concluido' (status_id = 4)
export const finalizar = async (req, res) => {
  const { id } = req.params;

  try {
    // 💡 3FN limpia: Ponemos status_id = 4 (Concluido) manteniendo su área actual intacta
    await pool.query('UPDATE tasks SET status_id = 4 WHERE id = ?', [id]);
    res.json({ message: 'Estatus actualizado a Concluido exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el estatus de la tarea.' });
  }
};
