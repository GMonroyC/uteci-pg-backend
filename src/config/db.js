import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Permite conectar con certificados autofirmados de Aiven
  }
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar a la base de datos en Aiven:', err.stack);
  } else {
    console.log('✅ Conexión exitosa a la base de datos PostgreSQL en Aiven.io');
    release();
  }
});

export default pool;
