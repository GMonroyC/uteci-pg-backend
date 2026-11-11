// ==============================================
// RUTAS: Tareas y Asignaciones (PostgreSQL)
// ==============================================
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT t.id, t.titulo, t.descripcion, t.fecha_entrega AS "fechaEntrega", m.nombre AS materia, p.nombre AS profesor 
            FROM tareas t 
            JOIN materias m ON t.materias_id = m.id 
            JOIN profesores p ON t.profesores_id = p.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { materias_id, profesores_id, titulo, descripcion, fecha_entrega } = req.body;
    try {
        const query = `
            INSERT INTO tareas (materias_id, profesores_id, titulo, descripcion, fecha_entrega) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id
        `;
        const result = await pool.query(query, [
            materias_id, 
            profesores_id, 
            titulo, 
            descripcion, 
            fecha_entrega
        ]);

        res.json({ id: result.rows[0].id, mensaje: 'Tarea creada con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
