// ==============================================
// RUTAS: Profesores y Nómina (PostgreSQL)
// ==============================================
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function obtenerMesActualEtiqueta() {
  const ahora = new Date();
  return `${MESES_ES[ahora.getMonth()]} ${ahora.getFullYear()}`;
}

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.nombre,
        p.especialidad,
        p.email,
        p.salario_mensual AS salario,
        p.activo,
        COALESCE(nm.estado, 'Pendiente') AS estado_pago,
        nm.mes AS mes_nomina,
        nm.monto AS monto_nomina,
        nm.fecha_pago
      FROM public.profesores p
      LEFT JOIN LATERAL (
        SELECT estado, mes, monto, fecha_pago
        FROM public.nomina_mensual
        WHERE profesores_id = p.id
        ORDER BY id DESC
        LIMIT 1
      ) nm ON true
      ORDER BY p.id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nombre, especialidad, email, salario_mensual } = req.body;

  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const especialidadLimpia =
    typeof especialidad === 'string' && especialidad.trim() !== ''
      ? especialidad.trim()
      : null;
  const emailLimpio =
    typeof email === 'string' && email.trim() !== ''
      ? email.trim().toLowerCase()
      : null;

  if (!nombreLimpio) {
    return res.status(400).json({ error: 'El nombre del profesor es obligatorio.' });
  }

  if (nombreLimpio.length > 150) {
    return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres.' });
  }

  if (especialidadLimpia && especialidadLimpia.length > 100) {
    return res.status(400).json({ error: 'La especialidad no puede exceder 100 caracteres.' });
  }

  if (emailLimpio && emailLimpio.length > 150) {
    return res.status(400).json({ error: 'El correo no puede exceder 150 caracteres.' });
  }

  const salarioRaw =
    salario_mensual === '' || salario_mensual === undefined || salario_mensual === null
      ? 0
      : Number(salario_mensual);

  if (Number.isNaN(salarioRaw) || !Number.isFinite(salarioRaw) || salarioRaw < 0) {
    return res
      .status(400)
      .json({ error: 'El salario mensual debe ser un número mayor o igual a 0.' });
  }

  const salarioNormalizado = Number(salarioRaw.toFixed(2));

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO public.profesores (nombre, especialidad, email, salario_mensual, activo)
      VALUES ($1, $2, $3, $4, 1)
      RETURNING id, nombre, especialidad, email, salario_mensual AS salario, activo, created_at
      `,
      [nombreLimpio, especialidadLimpia, emailLimpio, salarioNormalizado]
    );

    return res.status(201).json({
      mensaje: 'Profesor registrado correctamente.',
      profesor: { ...rows[0], estado_pago: 'Pendiente' },
    });
  } catch (error) {
    if (error.code === '23505') {
      return res
        .status(409)
        .json({ error: 'Ya existe un profesor registrado con ese correo electrónico.' });
    }
    return res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const profesorId = Number(req.params.id);
  if (!Number.isInteger(profesorId) || profesorId <= 0) {
    return res.status(400).json({ error: 'El ID del profesor no es válido.' });
  }

  const { nombre, especialidad, email, salario_mensual, salario } = req.body;

  const nombreLimpio = typeof nombre === 'string' ? nombre.trim() : '';
  const especialidadLimpia =
    typeof especialidad === 'string' && especialidad.trim() !== ''
      ? especialidad.trim()
      : null;
  const emailLimpio =
    typeof email === 'string' && email.trim() !== ''
      ? email.trim().toLowerCase()
      : null;

  if (!nombreLimpio) {
    return res.status(400).json({ error: 'El nombre del profesor es obligatorio.' });
  }

  if (nombreLimpio.length > 150) {
    return res.status(400).json({ error: 'El nombre no puede exceder 150 caracteres.' });
  }

  if (especialidadLimpia && especialidadLimpia.length > 100) {
    return res.status(400).json({ error: 'La especialidad no puede exceder 100 caracteres.' });
  }

  if (emailLimpio && emailLimpio.length > 150) {
    return res.status(400).json({ error: 'El correo no puede exceder 150 caracteres.' });
  }

  const entradaSalario = salario_mensual !== undefined ? salario_mensual : salario;
  const salarioRaw =
    entradaSalario === '' || entradaSalario === undefined || entradaSalario === null
      ? 0
      : Number(entradaSalario);

  if (Number.isNaN(salarioRaw) || !Number.isFinite(salarioRaw) || salarioRaw < 0) {
    return res
      .status(400)
      .json({ error: 'El salario mensual debe ser un número mayor o igual a 0.' });
  }

  const salarioNormalizado = Number(salarioRaw.toFixed(2));

  try {
    const { rows } = await pool.query(
      `
      UPDATE public.profesores
      SET nombre = $1,
          especialidad = $2,
          email = $3,
          salario_mensual = $4
      WHERE id = $5
      RETURNING id, nombre, especialidad, email, salario_mensual AS salario, activo
      `,
      [nombreLimpio, especialidadLimpia, emailLimpio, salarioNormalizado, profesorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el profesor especificado.' });
    }

    return res.json({
      mensaje: 'Datos del profesor actualizados correctamente.',
      profesor: rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res
        .status(409)
        .json({ error: 'Ya existe otro profesor registrado con ese correo electrónico.' });
    }
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/baja', async (req, res) => {
  const profesorId = Number(req.params.id);
  if (!Number.isInteger(profesorId) || profesorId <= 0) {
    return res.status(400).json({ error: 'El ID del profesor no es válido.' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE public.profesores
      SET activo = 0
      WHERE id = $1
      RETURNING id, nombre, especialidad, email, salario_mensual AS salario, activo
      `,
      [profesorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el profesor especificado.' });
    }

    return res.json({
      mensaje: 'Baja del profesor registrada correctamente.',
      profesor: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/reactivar', async (req, res) => {
  const profesorId = Number(req.params.id);
  if (!Number.isInteger(profesorId) || profesorId <= 0) {
    return res.status(400).json({ error: 'El ID del profesor no es válido.' });
  }

  try {
    const { rows } = await pool.query(
      `
      UPDATE public.profesores
      SET activo = 1
      WHERE id = $1
      RETURNING id, nombre, especialidad, email, salario_mensual AS salario, activo
      `,
      [profesorId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No se encontró el profesor especificado.' });
    }

    return res.json({
      mensaje: 'Profesor reactivado correctamente.',
      profesor: rows[0],
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Actualiza SOLO el estado de pago en nomina_mensual sin alterar profesores.activo
router.put('/:id/pago', async (req, res) => {
  const profesorId = Number(req.params.id);
  if (!Number.isInteger(profesorId) || profesorId <= 0) {
    return res.status(400).json({ error: 'El ID del profesor no es válido.' });
  }

  const { estadoPago, mes } = req.body;
  const nuevoEstado = estadoPago === 'Pagado' ? 'Pagado' : 'Pendiente';
  const fechaPago = nuevoEstado === 'Pagado' ? new Date().toISOString().slice(0, 10) : null;

  try {
    const profRes = await pool.query(
      'SELECT id, salario_mensual FROM public.profesores WHERE id = $1',
      [profesorId]
    );

    if (profRes.rowCount === 0) {
      return res.status(404).json({ error: 'No se encontró el profesor especificado' });
    }

    const salarioBase = Number(profRes.rows[0].salario_mensual || 0);
    const mesObjetivo = mes || obtenerMesActualEtiqueta();

    const ultimoNomina = await pool.query(
      `
      SELECT id
      FROM public.nomina_mensual
      WHERE profesores_id = $1
      ORDER BY id DESC
      LIMIT 1
      `,
      [profesorId]
    );

    if (ultimoNomina.rowCount > 0) {
      await pool.query(
        `
        UPDATE public.nomina_mensual
        SET estado = $1,
            fecha_pago = $2
        WHERE id = $3
        `,
        [nuevoEstado, fechaPago, ultimoNomina.rows[0].id]
      );
    } else {
      await pool.query(
        `
        INSERT INTO public.nomina_mensual (profesores_id, mes, monto, estado, fecha_pago)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [profesorId, mesObjetivo, salarioBase, nuevoEstado, fechaPago]
      );
    }

    res.json({ mensaje: 'Estado del pago actualizado', estado_pago: nuevoEstado });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
