import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { reportesAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function Reportes() {
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarReportes();
  }, [fechaInicio, fechaFin]);

  const cargarReportes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await reportesAPI.getHistorial(fechaInicio, fechaFin);
      setDatos(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reportes...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Reportes</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-4 py-2 border rounded-lg"
            />
          </div>
          <button
            onClick={cargarReportes}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Actualizar
          </button>
        </div>
      </div>

      {datos && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Cajas por Empleado</h2>
              {datos.mermas_por_empleado?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datos.mermas_por_empleado}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_escaneado" fill="#10b981" name="Cajas Empacadas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de mermas en este período
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Tendencia de Actividad</h2>
              {datos.historial_diario?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={datos.historial_diario}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fecha" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total_escaneado" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Cajas"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de escaneos en este período
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Resumen de Mermas</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empleado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Mermas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cobradas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Desechadas</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {datos.mermas_por_empleado?.map((emp, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{emp.nombre}</td>
                    <td className="px-6 py-4 font-mono">{emp.codigo}</td>
                    <td className="px-6 py-4 text-right font-medium">{emp.total_mermas}</td>
                    <td className="px-6 py-4 text-right">
                      {emp.total_desechado || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {emp.total_desechado || 0}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      ${(emp.total_cobrado || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {(!datos.mermas_por_empleado || datos.mermas_por_empleado.length === 0) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                      No hay mermas registradas en este período
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Reportes;
