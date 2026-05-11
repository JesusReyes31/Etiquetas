import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const empleadosAPI = {
  getAll: () => api.get('/empleados'),
  getById: (id) => api.get(`/empleados/${id}`),
  getByCodigo: (codigo) => api.get(`/empleados/codigo/${codigo}`),
  create: (data) => api.post('/empleados', data),
  update: (id, data) => api.put(`/empleados/${id}`, data),
  delete: (id) => api.delete(`/empleados/${id}`)
};

export const entregasAPI = {
  getAll: (fecha) => api.get('/entregas', { params: { fecha } }),
  getResumen: (fecha) => api.get('/entregas/resumen', { params: { fecha } }),
  getByEmpleado: (empleadoId, fecha) => api.get(`/entregas/${empleadoId}`, { params: { fecha } }),
  getByCodigo: (codigo, fecha) => api.get(`/entregas/codigo/${codigo}`, { params: { fecha } }),
  create: (data) => api.post('/entregas', data),
  createBatch: (data) => api.post('/entregas/batch', data)
};

export const ajustesAPI = {
  getAll: (fecha, empleadoId) => api.get('/ajustes', { params: { fecha, empleado_id: empleadoId } }),
  getPeriodo: (fechaInicio, fechaFin) => api.get('/ajustes/periodo', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
  create: (data) => api.post('/ajustes', data)
};

export const reportesAPI = {
  getDashboard: (fecha) => api.get('/reportes/dashboard', { params: { fecha } }),
  getBalanceEmpleado: (empleadoId, fecha) => api.get(`/reportes/balance/${empleadoId}`, { params: { fecha } }),
  getBalancePorCodigo: (codigo, fecha) => api.get(`/reportes/balance-codigo/${codigo}`, { params: { fecha } }),
  getHistorial: (fechaInicio, fechaFin) => api.get('/reportes/historial', { params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin } }),
  getSys21Data: (fecha) => api.get('/reportes/sys21', { params: { fecha } })
};

export const sys21API = {
  buscarEmpleado: (idEmpleado) => api.get(`/sys21/buscar/${idEmpleado}`),
  getEscaneos: (idEmpleado, fecha) => api.get(`/sys21/escaneos/${idEmpleado}`, { params: { fecha } }),
  getResumen: (idEmpleado, fecha) => api.get(`/sys21/resumen/${idEmpleado}`, { params: { fecha } })
};

export const configAPI = {
  get: () => api.get('/config'),
  update: (data) => api.put('/config', data),
  testSys21: (data) => api.post('/config/test-sys21', data)
};

export default api;
