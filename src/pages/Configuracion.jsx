import { useState, useEffect } from 'react';
import { configAPI } from '../api';

function Configuracion() {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({
    costo_etiqueta: 0.50,
    sys21_campo: 'empaque',
    sys21_medida: 'destajo',
    sys21_empresa: 1,
    sys21_lotes: '',
    sys21_host: '',
    sys21_port: 1433,
    sys21_user: '',
    sys21_password: '',
    sys21_database: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      const response = await configAPI.get();
      setConfig(response.data);
      setForm({
        costo_etiqueta: response.data.costo_etiqueta || 0.50,
        sys21_campo: response.data.sys21_campo || 'empaque',
        sys21_medida: response.data.sys21_medida || 'destajo',
        sys21_empresa: response.data.sys21_empresa || 1,
        sys21_lotes: response.data.sys21_lotes || '',
        sys21_host: response.data.sys21_host || '',
        sys21_port: response.data.sys21_port || 1433,
        sys21_user: response.data.sys21_user || '',
        sys21_password: '',
        sys21_database: response.data.sys21_database || ''
      });
    } catch (err) {
      setError('Error al cargar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'sys21_empresa' || name === 'sys21_port' 
        ? parseInt(value) || 0 
        : name === 'costo_etiqueta'
          ? parseFloat(value) || 0
          : value
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setSaving(true);

    try {
      await configAPI.update(form);
      setMensaje('Configuración guardada correctamente');
      cargarConfig();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await configAPI.testSys21(form);
      setTestResult(response.data);
    } catch (err) {
      setTestResult({ success: false, message: 'Error al probar conexión' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Configuración</h1>

      {mensaje && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {testResult && (
        <div className={`border px-4 py-3 rounded mb-4 ${
          testResult.success 
            ? 'bg-green-100 border-green-400 text-green-700'
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {testResult.message}
        </div>
      )}

      <form onSubmit={handleGuardar}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Costos</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Costo por etiqueta ($)
              </label>
              <input
                type="number"
                name="costo_etiqueta"
                value={form.costo_etiqueta}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Conexión Sys21</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Host</label>
              <input
                type="text"
                name="sys21_host"
                value={form.sys21_host}
                onChange={handleChange}
                placeholder="192.168.1.100"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Puerto</label>
              <input
                type="number"
                name="sys21_port"
                value={form.sys21_port}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                name="sys21_user"
                value={form.sys21_user}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="sys21_password"
                value={form.sys21_password}
                onChange={handleChange}
                placeholder="(dejar vacío para no cambiar)"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Base de datos</label>
            <input
              type="text"
              name="sys21_database"
              value={form.sys21_database}
              onChange={handleChange}
              placeholder="ASL_Nomina"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="mt-4 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {testing ? 'Probando...' : 'Probar Conexión'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filtros Sys21</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Campo</label>
              <input
                type="text"
                name="sys21_campo"
                value={form.sys21_campo}
                onChange={handleChange}
                placeholder="empaque"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Medida</label>
              <input
                type="text"
                name="sys21_medida"
                value={form.sys21_medida}
                onChange={handleChange}
                placeholder="destajo"
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Empresa</label>
              <input
                type="number"
                name="sys21_empresa"
                value={form.sys21_empresa}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Lotes (separados por coma)
            </label>
            <input
              type="text"
              name="sys21_lotes"
              value={form.sys21_lotes}
              onChange={handleChange}
              placeholder="BANDAS EJOTE, EMBOLSADO, cuarto frio, bandas chile"
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Configuracion;
