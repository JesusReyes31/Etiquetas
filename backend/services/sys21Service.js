import { getSys21Connection } from '../database/sys21.js';
import { getDb } from '../database/sqlite.js';

function normalizeFecha(fecha) {
  if (!fecha) return '';
  const parts = fecha.split('-');
  if (parts.length === 3) {
    return `${parts[0]}${parts[1]}${parts[2]}`;
  }
  return fecha.toString().replaceAll('-', '').trim();
}

function normalizeCodigoEmpleado(codigo) {
  if (!codigo) return null;
  const num = parseInt(codigo, 10);
  return isNaN(num) ? codigo.toString().trim() : num.toString();
}

function buildEscaneosQuery(config, pool) {
  const lotesArray = (config.sys21_lotes || '')
    .split(',')
    .map(l => l.trim())
    .filter(Boolean);

  const request = pool.request();
  request.input('campo', config.sys21_campo);
  request.input('medida', config.sys21_medida);
  request.input('empresa', Number(config.sys21_empresa));

  let query = `
    SELECT 
      LTRIM(RTRIM(id_empleado)) AS id_empleado,
      MAX(nom_empleado) AS nom_empleado,
      SUM(cantidad) AS cantidad,
      SUM(costo) AS costo_total
    FROM ASL_Nomina.dbo.ViewBI
    WHERE campo = @campo
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

  query += ` GROUP BY LTRIM(RTRIM(id_empleado))`;

  return { query, request, lotesArray };
}

export function getConfig() {
  const db = getDb();
  return db.prepare('SELECT * FROM config WHERE id = 1').get();
}

export function updateConfig(nuevasConfig) {
  const db = getDb();

  const updates = [];
  const values = [];

  if (nuevasConfig.costo_etiqueta !== undefined) {
    updates.push('costo_etiqueta = ?');
    values.push(nuevasConfig.costo_etiqueta);
  }
  if (nuevasConfig.sys21_campo !== undefined) {
    updates.push('sys21_campo = ?');
    values.push(nuevasConfig.sys21_campo);
  }
  if (nuevasConfig.sys21_medida !== undefined) {
    updates.push('sys21_medida = ?');
    values.push(nuevasConfig.sys21_medida);
  }
  if (nuevasConfig.sys21_empresa !== undefined) {
    updates.push('sys21_empresa = ?');
    values.push(nuevasConfig.sys21_empresa);
  }
  if (nuevasConfig.sys21_lotes !== undefined) {
    updates.push('sys21_lotes = ?');
    values.push(nuevasConfig.sys21_lotes);
  }
  if (nuevasConfig.sys21_host !== undefined) {
    updates.push('sys21_host = ?');
    values.push(nuevasConfig.sys21_host);
  }
  if (nuevasConfig.sys21_port !== undefined) {
    updates.push('sys21_port = ?');
    values.push(nuevasConfig.sys21_port);
  }
  if (nuevasConfig.sys21_user !== undefined) {
    updates.push('sys21_user = ?');
    values.push(nuevasConfig.sys21_user);
  }
  if (nuevasConfig.sys21_password !== undefined) {
    updates.push('sys21_password = ?');
    values.push(nuevasConfig.sys21_password);
  }
  if (nuevasConfig.sys21_database !== undefined) {
    updates.push('sys21_database = ?');
    values.push(nuevasConfig.sys21_database);
  }

  if (updates.length > 0) {
    const stmt = db.prepare(`UPDATE config SET ${updates.join(', ')} WHERE id = 1`);
    stmt.run(...values);
  }

  return getConfig();
}

export async function getEscaneosSys21(fecha) {
  try {
    const pool = await getSys21Connection();
    const config = getConfig();
    const fechaSQL = normalizeFecha(fecha);

    const { query, request, lotesArray } = buildEscaneosQuery(config, pool);
    request.input('fecha', fechaSQL);

    console.log('[getEscaneosSys21] Query:', query);
    console.log('[getEscaneosSys21] Params:', { fecha: fechaSQL, lotes: lotesArray });

    const result = await request.query(query);
    console.log('[getEscaneosSys21] Result count:', result.recordset.length);
    
    return result.recordset;
  } catch (error) {
    console.error('Error consultando Sys21:', error);
    throw error;
  }
}

export async function getEscaneosByEmpleadoSys21(empleadoId, fecha) {
  try {
    const pool = await getSys21Connection();
    const config = getConfig();
    const fechaSQL = normalizeFecha(fecha);
    const codigoNorm = normalizeCodigoEmpleado(empleadoId);

    const lotesArray = (config.sys21_lotes || '')
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);

    const request = pool.request();
    request.input('fecha', fechaSQL);
    request.input('codigoNorm', codigoNorm);
    request.input('codigoNum', parseInt(codigoNorm, 10) || 0);
    request.input('campo', config.sys21_campo);
    request.input('medida', config.sys21_medida);
    request.input('empresa', Number(config.sys21_empresa));

    let query = `
      SELECT 
        LTRIM(RTRIM(id_empleado)) AS id_empleado,
        MAX(nom_empleado) AS nom_empleado,
        SUM(cantidad) AS cantidad,
        SUM(costo) AS costo_total
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

    query += ` GROUP BY LTRIM(RTRIM(id_empleado))`;

    console.log('[getEscaneosByEmpleadoSys21] Query:', query);
    console.log('[getEscaneosByEmpleadoSys21] Params:', { 
      fecha: fechaSQL, 
      codigoNorm, 
      codigoNum: parseInt(codigoNorm, 10) || 0,
      lotes: lotesArray 
    });

    const result = await request.query(query);
    console.log('[getEscaneosByEmpleadoSys21] Result:', result.recordset);

    if (!result.recordset.length) {
      return {
        id_empleado: codigoNorm,
        nom_empleado: '',
        cantidad: 0,
        costo_total: 0
      };
    }

    return result.recordset[0];
  } catch (error) {
    console.error('Error consultando empleado en Sys21:', error);
    return {
      id_empleado: normalizeCodigoEmpleado(empleadoId),
      nom_empleado: '',
      cantidad: 0,
      costo_total: 0
    };
  }
}