// ==============================================
// CONFIGURACIÓN DE POSTGRESQL (Aiven / Local)
// ==============================================
import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Pool } = pkg;

// Verificamos si existe la variable DATABASE_URL
const connectionString = process.env.DATABASE_URL;

const pool = new Pool(
  connectionString
    ? {
        connectionString,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        // Configuración alternativa por si prefieres separar las variables en el .env
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
        ssl: {
          rejectUnauthorized: false
        }
      }
);

export default pool;



//import pkg from 'pg';
//const { Pool } = pkg;
//import dotenv from 'dotenv';
//
//dotenv.config();
//
//const pool = new Pool({
//  connectionString: process.env.DATABASE_URL,
//  ssl: {
//    rejectUnauthorized: false // <--- Esto soluciona el error del certificado autofirmado
//  }
//});
//
//export default pool;
