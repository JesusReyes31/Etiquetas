import { Router } from 'express';
import { getEscaneosByEmpleadoSys21, getEscaneosSys21, getConfig } from '../services/sys21Service.js';

const router = Router();

function normalizeFecha(fecha) {
  if (!fecha) return '';
  const parts = fecha.split('-');
  if (parts.length === 3) {
    return `${parts[0]}${parts[1]}${parts[2]}`;
  }
  return fecha.toString().replaceAll('-', '').trim();
}

function normalizeCodigo(codigo) {
  if (!codigo) return null;
  const num = parseInt(codigo, 10);
  return isNaN(num) ? codigo : num.toString();
}

router.get('/buscar/:idEmpleado', async (req, res) => {
  try {
    const { getSys21Connection } = await import('../database/sys21.js');
    const pool = await getSys21Connection();
    const idEmpleadoNorm = normalizeCodigo(req.params.idEmpleado);
    
    const request = pool.request();
    request.input('codigoNorm', idEmpleadoNorm);
    request.input('codigoNum', parseInt(idEmpleadoNorm, 10) || 0);
    
    const query = `
      SELECT TOP 1
        LTRIM(RTRIM(id_empleado)) AS id_empleado,
        MAX(nom_empleado) AS nom_empleado
      FROM ASL_Nomina.dbo.ViewBI
      WHERE LTRIM(RTRIM(id_empleado)) = @codigoNorm
         OR id_empleado = @codigoNum
      GROUP BY id_empleado
    `;
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado en Sys21' });
    }
    
    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error buscando empleado:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/escaneos/:idEmpleado', async (req, res) => {
  try {
    const { idEmpleado } = req.params;
    const { fecha } = req.query;
    const fechaConsulta = fecha || normalizeFecha(new Date().toISOString().split('T')[0]);
    
    console.log('[GET /escaneos/:idEmpleado]', { idEmpleado, fecha: fechaConsulta });
    
    const result = await getEscaneosByEmpleadoSys21(idEmpleado, fechaConsulta);
    
    res.json({
      empleado_id: result.id_empleado,
      nom_empleado: result.nom_empleado,
      fecha: fechaConsulta,
      escaneados: result.cantidad || 0,
      costo_total: result.costo_total || 0
    });
  } catch (error) {
    console.error('Error obteniendo escaneos:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/resumen/:idEmpleado', async (req, res) => {
  try {
    const { idEmpleado } = req.params;
    const { fecha } = req.query;
    const fechaConsulta = fecha || normalizeFecha(new Date().toISOString().split('T')[0]);
    const config = getConfig();
    
    console.log('[GET /resumen/:idEmpleado]', { idEmpleado, fecha: fechaConsulta });
    
    const { getSys21Connection } = await import('../database/sys21.js');
    const pool = await getSys21Connection();
    const codigoNorm = normalizeCodigo(idEmpleado);
    
    const lotesArray = (config.sys21_lotes || '')
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);
    
    const request = pool.request();
    request.input('fecha', fechaConsulta);
    request.input('codigoNorm', codigoNorm);
    request.input('codigoNum', parseInt(codigoNorm, 10) || 0);
    request.input('campo', config.sys21_campo);
    request.input('medida', config.sys21_medida);
    request.input('empresa', Number(config.sys21_empresa));
    
    let query = `
      SELECT 
        LTRIM(RTRIM(id_empleado)) AS id_empleado,
        MAX(nom_empleado) AS nom_empleado,
        Fecha,
        nom_lote,
        cantidad,
        costo
      FROM ASL_Nomina.dbo.ViewBI
      WHERE (LTRIM(RTRIM(id_empleado)) = @codigoNorm OR id_empleado = @codigoNum)
        AND campo = @campo
        AND medida = @medida
        AND Empresa = @empresa
        AND CONVERT(CHAR(8), Fecha, 112) = @fecha
    `;
    
    if (lotesArray.length > 0) {
      const placeholders = lotesArray.map((_, i) => `@lote${i}`).join(',');
      query += ` AND nom_lote IN (${placeholders})`;
      lotesArray.forEach((lote, index) => {
        request.input(`lote${index}`, lote);
      });
    }
    
    query += ` ORDER BY Fecha DESC`;
    
    const result = await request.query(query);
    
    const totalEscaneado = result.recordset.reduce((sum, r) => sum + (r.cantidad || 0), 0);
    
    res.json({
      empleado_id: codigoNorm,
      nombre: result.recordset.length > 0 ? result.recordset[0].nom_empleado : 'Desconocido',
      fecha: fechaConsulta,
      total_escaneado: totalEscaneado,
      registros: result.recordset
    });
  } catch (error) {
    console.error('Error obteniendo resumen:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/debug/:idEmpleado', async (req, res) => {
  try {
    const { idEmpleado } = req.params;
    const { fecha } = req.query;
    const fechaConsulta = fecha || normalizeFecha(new Date().toISOString().split('T')[0]);
    const config = getConfig();
    
    const { getSys21Connection } = await import('../database/sys21.js');
    const pool = await getSys21Connection();
    const codigoNorm = normalizeCodigo(idEmpleado);
    
    const lotesArray = (config.sys21_lotes || '')
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);
    
    const request = pool.request();
    request.input('fecha', fechaConsulta);
    request.input('codigoNorm', codigoNorm);
    request.input('codigoNum', parseInt(codigoNorm, 10) || 0);
    request.input('campo', config.sys21_campo);
    request.input('medida', config.sys21_medida);
    request.input('empresa', Number(config.sys21_empresa));
    
    let query = `
      SELECT TOP (1000)
        Empresa,
        id_empleado,
        nom_empleado,
        Fecha,
        campo,
        nom_lote,
        medida,
        cantidad,
        costo
      FROM ASL_Nomina.dbo.ViewBI
      WHERE (LTRIM(RTRIM(id_empleado)) = @codigoNorm OR id_empleado = @codigoNum)
        AND campo = @campo
        AND medida = @medida
        AND Empresa = @empresa
        AND CONVERT(CHAR(8), Fecha, 112) = @fecha
    `;
    
    if (lotesArray.length > 0) {
      const placeholders = lotesArray.map((_, i) => `@lote${i}`).join(',');
      query += ` AND nom_lote IN (${placeholders})`;
      lotesArray.forEach((lote, index) => {
        request.input(`lote${index}`, lote);
      });
    }
    
    query += ` ORDER BY Fecha DESC`;
    
    const result = await request.query(query);
    
    const total = result.recordset.reduce((sum, r) => sum + (r.cantidad || 0), 0);
    
    res.json({
      consulta_sql: query,
      parametros: {
        fecha: fechaConsulta,
        codigoNorm,
        codigoNum: parseInt(codigoNorm, 10) || 0,
        campo: config.sys21_campo,
        medida: config.sys21_medida,
        empresa: config.sys21_empresa,
        lotes: lotesArray
      },
      total_registros: result.recordset.length,
      suma_cantidad: total,
      registros: result.recordset
    });
  } catch (error) {
    console.error('Error en debug:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
