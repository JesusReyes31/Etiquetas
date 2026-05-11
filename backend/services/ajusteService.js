import { getDb } from '../database/sqlite.js';

export function getAjustesByFecha(fecha) {
  const db = getDb();
  return db.prepare(`
    SELECT a.*, emp.codigo, emp.nombre
    FROM ajustes_mermas a
    JOIN empleados emp ON a.empleado_id = emp.id
    WHERE a.fecha = ?
    ORDER BY a.created_at DESC
  `).all(fecha);
}

export function getAjustesByEmpleado(empleadoId, fecha = null) {
  const db = getDb();
  if (fecha) {
    return db.prepare(`
      SELECT * FROM ajustes_mermas 
      WHERE empleado_id = ? AND fecha = ?
      ORDER BY created_at DESC
    `).all(empleadoId, fecha);
  }
  return db.prepare(`
    SELECT * FROM ajustes_mermas 
    WHERE empleado_id = ?
    ORDER BY fecha DESC
  `).all(empleadoId);
}

export function getTotalMermasByEmpleado(empleadoId, fecha) {
  const db = getDb();
  const result = db.prepare(`
    SELECT COALESCE(SUM(mermas), 0) as total 
    FROM ajustes_mermas 
    WHERE empleado_id = ? AND fecha = ?
  `).get(empleadoId, fecha);
  return result.total;
}

export function createAjuste(empleadoId, fecha, mermas, decision, monto, observacion = null) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO ajustes_mermas (empleado_id, fecha, mermas, decision, monto, observacion) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(empleadoId, fecha, mermas, decision, monto, observacion);
  return { 
    id: result.lastInsertRowid, 
    empleado_id: empleadoId, 
    fecha, 
    mermas, 
    decision, 
    monto,
    observacion 
  };
}

export function getMermasCobradas(fechaInicio, fechaFin) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      emp.id as empleado_id,
      emp.codigo,
      emp.nombre,
      SUM(a.mermas) as total_mermas,
      SUM(CASE WHEN a.decision = 'cobrar' THEN a.monto ELSE 0 END) as total_cobrado,
      SUM(CASE WHEN a.decision = 'desechar' THEN a.mermas ELSE 0 END) as total_desechado
    FROM ajustes_mermas a
    JOIN empleados emp ON a.empleado_id = emp.id
    WHERE a.fecha BETWEEN ? AND ?
    GROUP BY emp.id, emp.codigo, emp.nombre
    ORDER BY total_mermas DESC
  `).all(fechaInicio, fechaFin);
}
