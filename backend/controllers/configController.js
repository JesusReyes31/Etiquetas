import { getConfig, updateConfig } from '../services/sys21Service.js';
import { testConnection } from '../database/sys21.js';

export function get(req, res) {
  try {
    const config = getConfig();
    const { sys21_password, sys21_user, ...configSinPass } = config;
    res.json({
      ...configSinPass,
      tiene_conexion_sys21: !!(config.sys21_host && config.sys21_database)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export function update(req, res) {
  try {
    const configActualizada = updateConfig(req.body);
    const { sys21_password, sys21_user, ...configSinPass } = configActualizada;
    res.json({
      ...configSinPass,
      mensaje: 'Configuración actualizada correctamente'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function testSys21(req, res) {
  try {
    if (req.body) {
      updateConfig(req.body);
    }
    
    const result = await testConnection();
    res.json(result);
  } catch (error) {
    res.json({ success: false, message: `Error: ${error.message}` });
  }
}
