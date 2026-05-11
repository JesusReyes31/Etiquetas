import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'sistema.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS empleados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      nombre TEXT NOT NULL,
      activo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS entregas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      cantidad INTEGER NOT NULL,
      observacion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    );

    CREATE TABLE IF NOT EXISTS ajustes_mermas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      empleado_id INTEGER NOT NULL,
      fecha DATE NOT NULL,
      mermas INTEGER NOT NULL,
      decision TEXT NOT NULL CHECK(decision IN ('cobrar', 'desechar')),
      monto DECIMAL(10,2),
      observacion TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empleado_id) REFERENCES empleados(id)
    );

    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      costo_etiqueta DECIMAL(10,2) DEFAULT 0.50,
      sys21_campo TEXT DEFAULT 'empaque',
      sys21_medida TEXT DEFAULT 'destajo',
      sys21_empresa INTEGER DEFAULT 1,
      sys21_lotes TEXT DEFAULT 'BANDAS EJOTE,EMBOLSADO,cuarto frio,bandas chile',
      sys21_host TEXT,
      sys21_port INTEGER DEFAULT 1433,
      sys21_user TEXT,
      sys21_password TEXT,
      sys21_database TEXT
    );

    INSERT OR IGNORE INTO config (id, costo_etiqueta) VALUES (1, 0.50);
  `);

  console.log('Base de datos SQLite inicializada correctamente');
  return database;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
