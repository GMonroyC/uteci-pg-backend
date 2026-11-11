// ==============================================
// RUTAS: Alumnos y Colegiaturas (PostgreSQL)
// ==============================================
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

// Obtener todos los alumnos
router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM alumnos');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener colegiaturas de un alumno específico
router.get('/:id/colegiaturas', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await pool.query(
            'SELECT * FROM colegiaturas WHERE alumnos_id = $1 ORDER BY id ASC', 
            [id]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registrar nuevo alumno y generar sus 12 meses de colegiatura
router.post('/', async (req, res) => {
    const { matricula, nombre, grado, grupo, anoInicio, mesInicio } = req.body;
    try {
        const ano = parseInt(anoInicio) || new Date().getFullYear();
        const mesIndex = mesInicio !== undefined ? parseInt(mesInicio) : 0;

        // En PostgreSQL usamos RETURNING id para obtener el ID insertado
        const insertAlumnoQuery = `
            INSERT INTO alumnos (matricula, nombre, grado, grupo) 
            VALUES ($1, $2, $3, $4) RETURNING id
        `;
        const alumnoResult = await pool.query(insertAlumnoQuery, [matricula, nombre, grado, grupo]);
        const alumnoId = alumnoResult.rows[0].id;

        const nombresMeses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const montoMensual = 1500.00;

        for (let i = 0; i < 12; i++) {
            const currentMonthIdx = (mesIndex + i) % 12;
            const currentYear = ano + Math.floor((mesIndex + i) / 12);
            const nombreMesAnio = `${nombresMeses[currentMonthIdx]} ${currentYear}`;

            await pool.query(
                'INSERT INTO colegiaturas (alumnos_id, mes, monto, estado) VALUES ($1, $2, $3, $4)',
                [alumnoId, nombreMesAnio, montoMensual, 'Pendiente']
            );
        }

        res.json({ id: alumnoId, mensaje: 'Alumno y su plan de colegiaturas creados con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar estado de una colegiatura
router.put('/:id/colegiatura', async (req, res) => {
    const { id } = req.params;
    const { estado, mes } = req.body;
    
    try {
        const updateQuery = `
            UPDATE colegiaturas 
            SET estado = $1, 
                fecha_pago = CASE WHEN $2 = 'Al día' THEN CURRENT_DATE ELSE NULL END 
            WHERE alumnos_id = $3 AND mes = $4
        `;
        const result = await pool.query(updateQuery, [estado, estado, id, mes]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No se encontró la colegiatura para este alumno y mes' });
        }

        res.json({ mensaje: 'Pago de colegiatura actualizado con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener panel de colegiaturas atrasadas (Adaptado con STRING_AGG)
router.get('/atrasadas/listado', async (req, res) => {
    try {
        const query = `
            SELECT 
                a.id AS alumno_id,
                a.nombre,
                a.matricula,
                a.grado,
                a.grupo,
                COUNT(CASE WHEN c.estado IN ('Pendiente', 'Atrasado') THEN 1 END) AS meses_adeudados,
                SUM(CASE WHEN c.estado IN ('Pendiente', 'Atrasado') THEN c.monto ELSE 0 END) AS total_adeudado,
                STRING_AGG(CASE WHEN c.estado IN ('Pendiente', 'Atrasado') THEN c.mes END, ', ' ORDER BY c.id) AS lista_meses_pendientes
            FROM alumnos a
            JOIN colegiaturas c ON a.id = c.alumnos_id
            GROUP BY a.id, a.nombre, a.matricula, a.grado, a.grupo
            HAVING COUNT(CASE WHEN c.estado IN ('Pendiente', 'Atrasado') THEN 1 END) > 0
        `;
        const { rows } = await pool.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
