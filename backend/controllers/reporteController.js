import { getBalanceDelDia, getBalanceEmpleado, getHistorial } from '../services/mermaService.js';
import { getEscaneosSys21, getConfig } from '../services/sys21Service.js';
import { getTotalEntregadoByCodigo, getEscaneosByCodigo } from '../services/entregaService.js';
import { normalizeCodigo } from '../utils.js';

function getFechaHoy() {
  return new Date().toISOString().split('T')[0];
}

export async function dashboard(req, res) {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    
    const balance = await getBalanceDelDia(fechaConsulta);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function balanceEmpleado(req, res) {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    
    const balance = await getBalanceEmpleado(req.params.empleadoId, fechaConsulta);
    res.json(balance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function balanceEmpleadoPorCodigo(req, res) {
  try {
    const { codigo } = req.params;
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    const codigoNormalizado = normalizeCodigo(codigo);
    
    const config = getConfig();
    const totalEntregado = getTotalEntregadoByCodigo(codigoNormalizado, fechaConsulta);
    const escaneosData = await getEscaneosByCodigo(codigoNormalizado, fechaConsulta);
    const totalEscaneado = escaneosData.cantidad || 0;
    const mermas = Math.max(0, totalEntregado - totalEscaneado);
    
    res.json({
      codigo: codigoNormalizado,
      fecha: fechaConsulta,
      entregadas: totalEntregado,
      escaneadas: totalEscaneado,
      mermas,
      costo_mermas: mermas * config.costo_etiqueta,
      costo_por_etiqueta: config.costo_etiqueta,
      tiene_alerta: mermas > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function historial(req, res) {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }

    const historial = await getHistorial({ fechaInicio: fecha_inicio, fechaFin: fecha_fin });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function sys21Data(req, res) {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha || getFechaHoy();
    
    const config = getConfig();
    const data = await getEscaneosSys21(fechaConsulta);
    
    res.json({
      filtros: {
        fecha: fechaConsulta,
        campo: config.sys21_campo,
        medida: config.sys21_medida,
        empresa: config.sys21_empresa,
        lotes: config.sys21_lotes.split(',').map(l => l.trim())
      },
      resultado: data,
      total_registros: data.length
    });
  } catch (error) {
    res.status(500).json({ 
      error: error.message, 
      detalle: 'No se pudo conectar a Sys21',
      filtros: getConfig()
    });
  }
}
