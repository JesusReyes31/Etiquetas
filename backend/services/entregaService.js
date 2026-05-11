import { getDb } from '../database/sqlite.js';
import { normalizeCodigo } from '../utils.js';

export function getEntregasByFecha(fecha) {
  const db = getDb();
  return db.prepare(`
    SELECT e.*, emp.codigo, emp.nombre 
    FROM entregas e 
    JOIN empleados emp ON e.empleado_id = emp.id 
    WHERE e.fecha = ?
    ORDER BY e.created_at DESC
  `).all(fecha);
}

export function getEntregasByEmpleado(empleadoId, fecha = null) {
  const db = getDb();
  const codigoNormalizado = normalizeCodigo(empleadoId);
  
  if (fecha) {
    return db.prepare(`
      SELECT e.*, emp.codigo, emp.nombre 
      FROM entregas e 
      JOIN empleados emp ON e.empleado_id = emp.id 
      WHERE CAST(emp.codigo AS INTEGER) = ? AND e.fecha = ?
      ORDER BY e.created_at DESC
    `).all(parseInt(codigoNormalizado, 10), fecha);
  }
  return db.prepare(`
    SELECT e.*, emp.codigo, emp.nombre 
    FROM entregas e 
    JOIN empleados emp ON e.empleado_id = emp.id 
    WHERE CAST(emp.codigo AS INTEGER) = ?
    ORDER BY e.fecha DESC
  `).all(parseInt(codigoNormalizado, 10));
}

export function getTotalEntregadoByEmpleado(empleadoId, fecha) {
  const db = getDb();
  
  const result = db.prepare(`
    SELECT COALESCE(SUM(e.cantidad), 0) as total 
    FROM entregas e
    JOIN empleados emp ON e.empleado_id = emp.id
    WHERE emp.id = ? AND e.fecha = ?
  `).get(empleadoId, fecha);
  return result.total;
}

export function getTotalEntregadoByCodigo(codigo, fecha) {
  const db = getDb();
  const codigoNormalizado = normalizeCodigo(codigo);
  
  const result = db.prepare(`
    SELECT COALESCE(SUM(e.cantidad), 0) as total 
    FROM entregas e
    JOIN empleados emp ON e.empleado_id = emp.id
    WHERE CAST(emp.codigo AS INTEGER) = ? AND e.fecha = ?
  `).get(parseInt(codigoNormalizado, 10), fecha);
  return result.total;
}

export async function getEscaneosByCodigo(codigo, fecha) {
  try {
    const { getEscaneosSys21 } = await import('./sys21Service.js');
    const escaneos = await getEscaneosSys21(fecha);
    
    const codigoNormalizado = normalizeCodigo(codigo);
    const encontrado = escaneos.find(
      e => normalizeCodigo(e.id_empleado) === codigoNormalizado
    );
    
    return {
      cantidad: encontrado ? encontrado.cantidad : 0,
      datos: encontrado || null
    };
  } catch (error) {
    console.error('Error getEscaneosByCodigo:', error);
    return { cantidad: 0, datos: null };
  }
}

export function getEntregasByCodigo(codigo, fecha) {
  const db = getDb();
  const codigoNormalizado = normalizeCodigo(codigo);
  
  console.log('=== DEBUG getEntregasByCodigo ===');
  console.log('Código:', codigo);
  console.log('Código normalizado:', codigoNormalizado);
  console.log('Fecha:', fecha);
  
  const result = db.prepare(`
    SELECT e.*, emp.codigo, emp.nombre 
    FROM entregas e 
    JOIN empleados emp ON e.empleado_id = emp.id 
    WHERE CAST(emp.codigo AS INTEGER) = ? AND e.fecha = ?
    ORDER BY e.created_at DESC
  `).all(parseInt(codigoNormalizado, 10), fecha);
  
  console.log('Resultados:', result);
  console.log('========================');
  
  return result;
}

export function createEntrega(empleadoId, cantidad, fecha, observacion = null) {
  const db = getDb();
  
  const stmt = db.prepare(`
    INSERT INTO entregas (empleado_id, cantidad, fecha, observacion) 
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(empleadoId, cantidad, fecha, observacion);
  
  return { 
    id: result.lastInsertRowid, 
    empleado_id: empleadoId, 
    cantidad, 
    fecha, 
    observacion 
  };
}

export function getEntregasDelDia(fecha) {
  const db = getDb();
  return db.prepare(`
    SELECT 
      emp.id as empleado_id,
      emp.codigo,
      emp.nombre,
      COALESCE(SUM(e.cantidad), 0) as total_entregado
    FROM empleados emp
    LEFT JOIN entregas e ON emp.id = e.empleado_id AND e.fecha = ?
    WHERE emp.activo = 1
    GROUP BY emp.id, emp.codigo, emp.nombre
    ORDER BY emp.codigo
  `).all(fecha);
}

export function findOrCreateEmpleadoByCodigo(codigo, nombre) {
  const db = getDb();
  const codigoNormalizado = normalizeCodigo(codigo);
  
  let empleado = db.prepare(`
    SELECT * FROM empleados WHERE CAST(codigo AS INTEGER) = ?
  `).get(parseInt(codigoNormalizado, 10));
  
  if (!empleado) {
    const stmt = db.prepare(`
      INSERT INTO empleados (codigo, nombre) VALUES (?, ?)
    `);
    const result = stmt.run(codigoNormalizado, nombre);
    empleado = {
      id: result.lastInsertRowid,
      codigo: codigoNormalizado,
      nombre: nombre
    };
  }
  
  return empleado;
}
