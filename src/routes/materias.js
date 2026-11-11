// ==============================================
// RUTAS: Materias y Horarios (PostgreSQL)
// ==============================================
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT m.*, p.nombre AS profesor 
            FROM materias m 
            LEFT JOIN profesores p ON m.profesores_id = p.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { codigo, nombre, creditos, profesores_id, salones_id, horario } = req.body;
    try {
        const query = `
            INSERT INTO materias (codigo, nombre, creditos, profesores_id, salones_id, horario) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id
        `;
        const result = await pool.query(query, [
            codigo, 
            nombre, 
            creditos, 
            profesores_id || null, 
            salones_id || null, 
            horario
        ]);
        
        res.json({ id: result.rows[0].id, mensaje: 'Materia registrada con éxito' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
