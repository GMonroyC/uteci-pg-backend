// ==============================================
// RUTAS: Profesores y Nómina (PostgreSQL)
// ==============================================
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, nombre, especialidad, email, salario_mensual AS salario, activo 
            FROM profesores
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/pago', async (req, res) => {
    const { id } = req.params;
    const { estadoPago } = req.body;
    try {
        const activoVal = estadoPago === 'Pagado' ? 1 : 0;
        const result = await pool.query(
            'UPDATE profesores SET activo = $1 WHERE id = $2', 
            [activoVal, id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'No se encontró el profesor especificado' });
        }

        res.json({ mensaje: 'Estado del profesor actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
