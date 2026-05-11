import { getDb } from '../database/sqlite.js';

export function getAllEmpleados() {
  const db = getDb();
  return db.prepare('SELECT * FROM empleados WHERE activo = 1 ORDER BY codigo').all();
}

export function getEmpleadoById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM empleados WHERE id = ?').get(id);
}

export function getEmpleadoByCodigo(codigo) {
  const db = getDb();
  return db.prepare('SELECT * FROM empleados WHERE codigo = ?').get(codigo);
}

export function createEmpleado(codigo, nombre) {
  const db = getDb();
  const stmt = db.prepare('INSERT INTO empleados (codigo, nombre) VALUES (?, ?)');
  const result = stmt.run(codigo, nombre);
  return { id: result.lastInsertRowid, codigo, nombre };
}

export function updateEmpleado(id, codigo, nombre) {
  const db = getDb();
  const stmt = db.prepare('UPDATE empleados SET codigo = ?, nombre = ? WHERE id = ?');
  stmt.run(codigo, nombre, id);
  return getEmpleadoById(id);
}

export function deleteEmpleado(id) {
  const db = getDb();
  const stmt = db.prepare('UPDATE empleados SET activo = 0 WHERE id = ?');
  stmt.run(id);
  return { success: true };
}
