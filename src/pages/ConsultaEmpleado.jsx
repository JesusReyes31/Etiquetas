import { useState } from 'react';
import { format } from 'date-fns';
import { sys21API, entregasAPI } from '../api';
import { normalizeCodigo } from '../utils';

function ConsultaEmpleado() {
  const [idEmpleado, setIdEmpleado] = useState('');
  const [codigoNormalizado, setCodigoNormalizado] = useState('');
  const [empleado, setEmpleado] = useState(null);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [error, setError] = useState(null);
  const [datos, setDatos] = useState(null);

  const handleCodigoChange = (e) => {
    const value = e.target.value;
    setIdEmpleado(value);
    setCodigoNormalizado(normalizeCodigo(value));
  };

  const buscarEmpleado = async () => {
    const codigoNorm = normalizeCodigo(idEmpleado);
    if (!codigoNorm) return;
    
    setLoading(true);
    setError(null);
    setEmpleado(null);
    setDatos(null);
    
    try {
      const response = await sys21API.buscarEmpleado(codigoNorm);
      setEmpleado(response.data);
      await cargarDatos(codigoNorm, fecha);
    } catch (err) {
      setError(err.response?.data?.error || 'Empleado no encontrado en Sys21');
    } finally {
      setLoading(false);
    }
  };
const cargarDatos = async (codigoEmp, fechaEmp) => {
  setLoadingDatos(true);
  setError(null);

  try {
    const [escaneosResponse, entregasResponse] = await Promise.all([
      sys21API.getEscaneos(codigoEmp, fechaEmp).catch(() => ({ data: { escaneados: 0 } })),
      entregasAPI.getByCodigo(codigoEmp, fechaEmp).catch(() => ({ data: { total_entregado: 0, entregas: [] } }))
    ]);

    const escaneosRes = escaneosResponse.data || escaneosResponse;
    const entregasRes = entregasResponse.data || entregasResponse;

    const totalEscaneado = escaneosRes?.escaneados ?? 0;
    const totalEntregado = entregasRes?.total_entregado ?? 0;
    const mermas = Math.max(0, totalEntregado - totalEscaneado);

    setDatos({
      escaneados: totalEscaneado,
      entregados: totalEntregado,
      mermas,
      tiene_alerta: mermas > 0,
      estado:
        totalEntregado === 0
          ? 'Sin entregas registradas'
          : mermas === 0
            ? '✓ Completo'
            : `⚠️ ${mermas} pendientes`,
      historial: entregasRes?.entregas || []
    });
  } catch (err) {
    console.error('Error cargando datos:', err);
    setError('Error al cargar datos');
  } finally {
    setLoadingDatos(false);
  }
};

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      buscarEmpleado();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Consulta Empleado</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Buscar Empleado</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              ID Empleado (de Sys21)
            </label>
            <input
              type="text"
              value={idEmpleado}
              onChange={handleCodigoChange}
              onKeyPress={handleKeyPress}
              placeholder="Ej: 20570"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {codigoNormalizado && idEmpleado !== codigoNormalizado && (
              <p className="text-sm text-gray-500 mt-1">
                Código normalizado: {codigoNormalizado}
              </p>
            )}
          </div>
          <div className="w-40">
            <label className="block text-gray-700 text-sm font-medium mb-1">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                if (empleado) cargarDatos(codigoNormalizado, e.target.value);
              }}
              className="w-full px-4 py-2 border rounded-lg"
            />
          </div>
        </div>

        <button
          onClick={buscarEmpleado}
          disabled={loading || !codigoNormalizado}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar Empleado'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {empleado && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full mr-4">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{empleado.nom_empleado}</h2>
              <p className="text-gray-500">ID: {empleado.id_empleado}</p>
            </div>
          </div>

          {loadingDatos ? (
            <div className="text-center py-4 text-gray-500">Cargando datos...</div>
          ) : datos && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Entregadas</p>
                  <p className="text-3xl font-bold text-blue-600">{datos.entregados}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">Escaneadas (Sys21)</p>
                  <p className="text-3xl font-bold text-green-600">{datos?.escaneados ?? 0}</p>
                </div>
                <div className={`rounded-lg p-4 text-center ${datos.tiene_alerta ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <p className="text-sm text-gray-500 mb-1">Mermas</p>
                  <p className={`text-3xl font-bold ${datos.tiene_alerta ? 'text-red-600' : 'text-gray-600'}`}>
                    {datos.mermas}
                  </p>
                </div>
              </div>

              <div className={`p-4 rounded-lg mb-4 ${
                datos.entregadas === 0 
                  ? 'bg-blue-50 border border-blue-200' 
                  : datos.tiene_alerta 
                    ? 'bg-yellow-50 border border-yellow-200' 
                    : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center">
                  <span className="text-2xl mr-3">
                    {datos.entregadas === 0 ? 'ℹ️' : datos.tiene_alerta ? '⚠️' : '✓'}
                  </span>
                  <div>
                    <p className="font-semibold">{datos.estado}</p>
                    {datos.entregadas === 0 && (
                      <p className="text-sm text-gray-600">
                        Sin entregas registradas. Mostrando solo escaneos de Sys21.
                      </p>
                    )}
                    {datos.tiene_alerta && (
                      <p className="text-sm text-gray-600">
                        Faltan {datos.mermas} etiquetas por escanear.
                      </p>
                    )}
                    {datos.entregadas > 0 && !datos.tiene_alerta && (
                      <p className="text-sm text-gray-600">
                        El empleado ha escaneado todas las etiquetas.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {datos.historial.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Historial de Entregas</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {datos.historial.map((entrega, index) => (
                      <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
                        <span className="text-sm text-gray-600">
                          {format(new Date(entrega.fecha), 'dd/MM/yyyy HH:mm')}
                        </span>
                        <span className="font-medium">{entrega.cantidad} etiquetas</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {datos.tiene_alerta && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="font-semibold text-red-800 mb-2">⚠️ Mermas Detectadas</p>
                  <p className="text-sm text-red-700">
                    El empleado tiene {datos.mermas} etiquetas sin escanear.
                    Se recomienda revisar con el gestor.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Cómo funciona:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ingrese el ID del empleado para ver su estado del día</li>
          <li>• <strong>Entregadas:</strong> Etiquetas que se le dieron desde este sistema</li>
          <li>• <strong>Escaneadas:</strong> Cajas empacadas según Sys21</li>
          <li>• <strong>Mermas:</strong> Etiquetas entregadas - Escaneadas</li>
        </ul>
      </div>
    </div>
  );
}

export default ConsultaEmpleado;
