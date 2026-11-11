// ==============================================
// SERVIDOR PRINCIPAL: UTECI CE Pro (PostgreSQL)
// ==============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';

// Importar las rutas adaptadas
import alumnosRoutes from './routes/alumnos.js';
import materiasRoutes from './routes/materias.js';
import profesoresRoutes from './routes/profesores.js';
import tareasRoutes from './routes/tareas.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de estado general
app.get('/control-escolar-backend', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de UTECI CE Pro funcionando correctamente con PostgreSQL (Aiven)' 
  });
});

// Registrar las rutas del sistema escolar con su prefijo
app.use('/control-escolar-backend/alumnos', alumnosRoutes);
app.use('/control-escolar-backend/materias', materiasRoutes);
app.use('/control-escolar-backend/profesores', profesoresRoutes);
app.use('/control-escolar-backend/tareas', tareasRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de UTECI CE Pro corriendo en el puerto ${PORT}`);
});
