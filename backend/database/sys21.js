import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

let pool = null;

export async function getSys21Connection() {
  if (!pool) {
    const config = {
      server: process.env.SYS21_HOST || 'localhost',
      port: parseInt(process.env.SYS21_PORT) || 1433,
      user: process.env.SYS21_USER,
      password: process.env.SYS21_PASSWORD,
      database: process.env.SYS21_DATABASE || 'ASL_Nomina',
      options: {
        encrypt: false,
        trustServerCertificate: true
      }
    };

    pool = await sql.connect(config);
  }
  return pool;
}

export async function testConnection() {
  try {
    const connection = await getSys21Connection();
    const result = await connection.query('SELECT 1 as test');
    return { success: true, message: 'Conexión exitosa a Sys21' };
  } catch (error) {
    return { success: false, message: `Error de conexión: ${error.message}` };
  }
}

export async function closeSys21Connection() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
