import { getEntregasDelDia, getTotalEntregadoByEmpleado } from './entregaService.js';
import { getAjustesByFecha, getMermasCobradas } from './ajusteService.js';
import { getEscaneosSys21, getEscaneosByEmpleadoSys21, getConfig } from './sys21Service.js';
import { getSys21Connection } from '../database/sys21.js';
import { normalizeCodigo } from '../utils.js';

function matchCodigo(codigo1, codigo2) {
  return normalizeCodigo(codigo1) === normalizeCodigo(codigo2);
}

function normalizeFecha(fecha) {
  if (!fecha) return '';
  const parts = fecha.split('-');
  if (parts.length === 3) {
    return `${parts[0]}${parts[1]}${parts[2]}`;
  }
  return fecha.toString().replaceAll('-', '').trim();
}

export async function getBalanceDelDia(fecha) {
  try {
    const entregas = getEntregasDelDia(fecha);
    const mermasRegistradas = getAjustesByFecha(fecha);
    let sys21Data = [];

    try {
      sys21Data = await getEscaneosSys21(fecha);
    } catch (error) {
      console.warn('No se pudo obtener datos de Sys21:', error.message);
    }

    const balance = {
      fecha,
      total_entregado: 0,
      total_sys21: 0,
      total_mermas: 0,
      mermas_registradas: mermasRegistradas,
      empleados: []
    };

    for (const entrega of entregas) {
      const sys21Empleado = sys21Data.find(
        s => matchCodigo(s.id_empleado, entrega.codigo)
      );
      
      const escaneados = sys21Empleado ? sys21Empleado.cantidad : 0;
      const mermasCalculadas = Math.max(0, entrega.total_entregado - escaneados);
      
      balance.total_entregado += entrega.total_entregado;
      balance.total_sys21 += escaneados;
      balance.total_mermas += mermasCalculadas;

      balance.empleados.push({
        id: entrega.empleado_id,
        codigo: entrega.codigo,
        nombre: entrega.nombre,
        entregadas: entrega.total_entregado,
        escaneadas: escaneados,
        mermas: mermasCalculadas,
        tiene_alerta: mermasCalculadas > 0
      });
    }

    return balance;
  } catch (error) {
    console.error('Error calculando balance:', error);
    throw error;
  }
}

export async function getBalanceEmpleado(empleadoId, fecha) {
  try {
    const totalEntregado = getTotalEntregadoByEmpleado(empleadoId, fecha);
    const config = getConfig();
    
    let escaneados = 0;
    try {
      const fechaSQL = normalizeFecha(fecha);
      const escaneoData = await getEscaneosByEmpleadoSys21(empleadoId, fechaSQL);
      escaneados = escaneoData.cantidad || 0;
    } catch (error) {
      console.warn('No se pudo obtener escaneados de Sys21:', error.message);
    }

    const mermas = Math.max(0, totalEntregado - escaneados);

    return {
      empleado_id: empleadoId,
      fecha,
      entregadas: totalEntregado,
      escaneadas: escaneados,
      mermas,
      costo_mermas: mermas * config.costo_etiqueta,
      costo_por_etiqueta: config.costo_etiqueta,
      tiene_alerta: mermas > 0
    };
  } catch (error) {
    console.error('Error calculando balance empleado:', error);
    throw error;
  }
}

export async function getHistorial(params) {
  const { fechaInicio, fechaFin } = params;
  
  const mermas = getMermasCobradas(fechaInicio, fechaFin);
  
  let historialDiario = [];
  try {
    const pool = await getSys21Connection();
    const config = getConfig();
    const fechaIniSQL = normalizeFecha(fechaInicio);
    const fechaFinSQL = normalizeFecha(fechaFin);
    
    const lotesArray = config.sys21_lotes.split(',').map(l => l.trim());
    
    let query;
    let request;
    
    if (lotesArray.length === 0 || (lotesArray.length === 1 && lotesArray[0] === '')) {
      query = `
        SELECT 
          CONVERT(DATE, Fecha) as fecha,
          SUM(cantidad) as total_escaneado
        FROM ASL_Nomina.dbo.ViewBI
        WHERE campo = @campo
          AND medida = @medida
          AND Empresa = @empresa
          AND CONVERT(CHAR(8), Fecha, 112) BETWEEN @fechaInicio AND @fechaFin
        GROUP BY CONVERT(DATE, Fecha)
        ORDER BY fecha
      `;
      
      request = pool.request();
      request.input('fechaInicio', fechaIniSQL);
      request.input('fechaFin', fechaFinSQL);
      request.input('campo', config.sys21_campo);
      request.input('medida', config.sys21_medida);
      request.input('empresa', config.sys21_empresa);
    } else {
      const placeholders = lotesArray.map((_, i) => `@lote${i}`).join(',');
      
      query = `
        SELECT 
          CONVERT(DATE, Fecha) as fecha,
          SUM(cantidad) as total_escaneado
        FROM ASL_Nomina.dbo.ViewBI
        WHERE campo = @campo
          AND medida = @medida
          AND Empresa = @empresa
          AND nom_lote IN (${placeholders})
          AND CONVERT(CHAR(8), Fecha, 112) BETWEEN @fechaInicio AND @fechaFin
        GROUP BY CONVERT(DATE, Fecha)
        ORDER BY fecha
      `;
      
      request = pool.request();
      request.input('fechaInicio', fechaIniSQL);
      request.input('fechaFin', fechaFinSQL);
      request.input('campo', config.sys21_campo);
      request.input('medida', config.sys21_medida);
      request.input('empresa', config.sys21_empresa);
      lotesArray.forEach((lote, i) => {
        request.input(`lote${i}`, lote);
      });
    }

    const result = await request.query(query);
    historialDiario = result.recordset;
  } catch (error) {
    console.warn('No se pudo obtener historial de Sys21:', error.message);
  }

  return {
    mermas_por_empleado: mermas,
    historial_diario: historialDiario
  };
}
