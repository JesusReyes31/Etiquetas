import * as entregaService from '../services/entregaService.js';
import * as empleadoService from '../services/empleadoService.js';
import { normalizeCodigo } from '../utils.js';

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

export function getAll(req, res) {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    const entregas = entregaService.getEntregasByFecha(fechaConsulta);
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getByEmpleado(req, res) {
  try {
    const { fecha } = req.query;
    const entregas = entregaService.getEntregasByEmpleado(req.params.empleadoId, fecha);
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getByCodigo(req, res) {
  try {
    const { codigo } = req.params;
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    const codigoNormalizado = normalizeCodigo(codigo);
    
    console.log('=== DEBUG getByCodigo ===');
    console.log('Código original:', codigo);
    console.log('Código normalizado:', codigoNormalizado);
    console.log('Fecha:', fechaConsulta);
    
    const entregas = entregaService.getEntregasByCodigo(codigoNormalizado, fechaConsulta);
    console.log('Entregas encontradas:', entregas);
    
    const total = entregas.reduce((sum, e) => sum + e.cantidad, 0);
    console.log('Total:', total);
    console.log('=========================');
    
    res.json({
      codigo: codigoNormalizado,
      fecha: fechaConsulta,
      entregas,
      total_entregado: total
    });
  } catch (error) {
    console.error('Error en getByCodigo:', error);
    res.status(500).json({ error: error.message });
  }
}

export function create(req, res) {
  try {
    const { cantidad, fecha, observacion, codigo_empleado, nombre_empleado } = req.body;
    
    if (!cantidad) {
      return res.status(400).json({ error: 'cantidad es requerida' });
    }

    const codigoNormalizado = normalizeCodigo(codigo_empleado);
    const empleado = entregaService.findOrCreateEmpleadoByCodigo(
      codigoNormalizado, 
      nombre_empleado || `Empleado ${codigoNormalizado}`
    );

    const fechaEntrega = fecha || getFechaHoy();
    const entrega = entregaService.createEntrega(empleado.id, cantidad, fechaEntrega, observacion);
    
    res.status(201).json({
      ...entrega,
      empleado: {
        id: empleado.id,
        codigo: empleado.codigo,
        nombre: empleado.nombre
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getResumenDelDia(req, res) {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    const entregas = entregaService.getEntregasDelDia(fechaConsulta);
    res.json(entregas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createBatch(req, res) {
  try {
    const { empleados, cantidad, fecha, observacion } = req.body;
    
    if (!empleados || !Array.isArray(empleados) || empleados.length === 0) {
      return res.status(400).json({ error: 'empleados es requerido y debe ser un array' });
    }
    
    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: 'cantidad debe ser mayor a 0' });
    }
    
    const fechaEntrega = fecha || getFechaHoy();
    const resultados = [];
    const errores = [];
    
    for (const emp of empleados) {
      try {
        const codigoNormalizado = normalizeCodigo(emp.codigo_empleado);
        const empleado = entregaService.findOrCreateEmpleadoByCodigo(
          codigoNormalizado,
          emp.nombre_empleado || `Empleado ${codigoNormalizado}`
        );
        
        const entrega = entregaService.createEntrega(empleado.id, cantidad, fechaEntrega, observacion);
        
        resultados.push({
          exito: true,
          entrega: {
            ...entrega,
            empleado: {
              id: empleado.id,
              codigo: empleado.codigo,
              nombre: empleado.nombre
            }
          }
        });
      } catch (error) {
        errores.push({
          codigo: emp.codigo_empleado,
          nombre: emp.nombre_empleado,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      cantidad_solicitada: cantidad,
      exitos: resultados.length,
      errores: errores.length,
      total_etiquetas: resultados.length * cantidad,
      fecha: fechaEntrega,
      resultados,
      errores
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
