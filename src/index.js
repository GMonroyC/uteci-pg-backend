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

// Ruta de estado general (raíz o /api/status)
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de UTECI CE Pro funcionando correctamente con PostgreSQL (Aiven)' 
  });
});

app.get('/api', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'API de UTECI CE Pro funcionando correctamente con PostgreSQL (Aiven)' 
  });
});

// Registrar las rutas del sistema escolar con un prefijo limpio /api
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/materias', materiasRoutes);
app.use('/api/profesores', profesoresRoutes);
app.use('/api/tareas', tareasRoutes);

// Puerto del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor de UTECI CE Pro corriendo en el puerto ${PORT}`);
});
