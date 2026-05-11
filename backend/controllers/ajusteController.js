import * as ajusteService from '../services/ajusteService.js';
import * as empleadoService from '../services/empleadoService.js';
import { getConfig } from '../services/sys21Service.js';

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

export function getAll(req, res) {
  try {
    const { fecha, empleado_id } = req.query;
    
    if (empleado_id) {
      const ajustes = ajusteService.getAjustesByEmpleado(empleado_id, fecha);
      return res.json(ajustes);
    }
    
    const fechaConsulta = fecha || getFechaHoy();
    const ajustes = ajusteService.getAjustesByFecha(fechaConsulta);
    res.json(ajustes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function create(req, res) {
  try {
    const { empleado_id, mermas, decision, observacion } = req.body;
    const { fecha } = req.body;
    
    if (!empleado_id || !mermas || !decision) {
      return res.status(400).json({ error: 'empleado_id, mermas y decision son requeridos' });
    }

    if (!['cobrar', 'desechar'].includes(decision)) {
      return res.status(400).json({ error: 'decision debe ser "cobrar" o "desechar"' });
    }

    const empleado = empleadoService.getEmpleadoById(empleado_id);
    if (!empleado) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    const config = getConfig();
    const monto = decision === 'cobrar' ? mermas * config.costo_etiqueta : 0;
    const fechaAjuste = fecha || getFechaHoy();

    const ajuste = ajusteService.createAjuste(
      empleado_id, 
      fechaAjuste, 
      mermas, 
      decision, 
      monto, 
      observacion
    );
    
    res.status(201).json({
      ...ajuste,
      empleado: {
        id: empleado.id,
        codigo: empleado.codigo,
        nombre: empleado.nombre
      },
      costo_etiqueta: config.costo_etiqueta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function getMermasPeriodo(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }

    const mermas = ajusteService.getMermasCobradas(fecha_inicio, fecha_fin);
    res.json(mermas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
