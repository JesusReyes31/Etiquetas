import { useState } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { sys21API, entregasAPI } from '../api';
import { normalizeCodigo } from '../utils';

function Entregar() {
  const navigate = useNavigate();
  
  const [codigo, setCodigo] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [empleadosNoEncontrados, setEmpleadosNoEncontrados] = useState([]);
  const [datos, setDatos] = useState(null);
  const [cantidad, setCantidad] = useState(50);
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  
  const hoy = format(new Date(), 'yyyy-MM-dd');

  const handleCodigoChange = (e) => {
    setCodigo(e.target.value);
  };

  const buscarEmpleados = async () => {
    if (!codigo.trim()) return;
    
    const codigos = codigo.split(',').map(c => c.trim()).filter(c => c);
    if (codigos.length === 0) return;
    
    setLoading(true);
    setError(null);
    setMensaje(null);
    setEmpleados([]);
    setEmpleadosNoEncontrados([]);
    setDatos(null);
    
    const encontrados = [];
    const noEncontrados = [];
    
    try {
      for (const cod of codigos) {
        const codigoNorm = normalizeCodigo(cod);
        if (!codigoNorm) {
          noEncontrados.push({ codigo: cod, razon: 'Código inválido' });
          continue;
        }
        
        try {
          const response = await sys21API.buscarEmpleado(codigoNorm);
          encontrados.push({
            codigo: codigoNorm,
            id_empleado: response.data.id_empleado,
            nom_empleado: response.data.nom_empleado
          });
        } catch (err) {
          noEncontrados.push({ codigo: cod, razon: 'No encontrado en Sys21' });
        }
      }
      
      setEmpleados(encontrados);
      setEmpleadosNoEncontrados(noEncontrados);
      
      if (encontrados.length > 0) {
        await cargarDatosMultiples(encontrados.map(e => e.codigo));
      }
    } catch (err) {
      setError('Error al buscar empleados');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosMultiples = async (codigos) => {
    setLoadingDatos(true);
    
    try {
      const resultados = [];
      for (const codigoEmp of codigos) {
        try {
          const [escaneosRes, entregasRes] = await Promise.all([
            sys21API.getEscaneos(codigoEmp, hoy).catch(() => ({ data: { escaneados: 0 } })),
            entregasAPI.getByCodigo(codigoEmp, hoy).catch(() => ({ data: { total_entregado: 0 } }))
          ]);
          
          resultados.push({
            codigo: codigoEmp,
            escaneados: escaneosRes.data?.escaneados || 0,
            entregado: entregasRes.data?.total_entregado || 0
          });
        } catch (e) {
          console.error('Error cargando datos para', codigoEmp, e);
        }
      }
      
      const totalEntregado = resultados.reduce((sum, r) => sum + r.entregados, 0);
      const totalEscaneado = resultados.reduce((sum, r) => sum + r.escaneados, 0);
      
      setDatos({
        porEmpleado: resultados,
        totalEntregado,
        totalEscaneado,
        mermas: Math.max(0, totalEntregado - totalEscaneado)
      });
    } catch (err) {
      console.error('Error cargando datos múltiples:', err);
      setError('Error al cargar datos');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleEntregar = async () => {
    if (empleados.length === 0 || cantidad <= 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const empleadosData = empleados.map(e => ({
        codigo_empleado: e.codigo,
        nombre_empleado: e.nom_empleado
      }));
      
      const response = await entregasAPI.createBatch({
        empleados: empleadosData,
        cantidad: parseInt(cantidad),
        fecha: hoy,
        observacion
      });
      
      const data = response.data;
      
      if (data.errores && data.errores.length > 0) {
        setMensaje({
          tipo: 'warning',
          texto: `Entregado a ${data.exitos}/${empleados.length} empleados. ${data.errores.length} errores.`
        });
      } else {
        setMensaje({
          tipo: 'success',
          texto: `¡Entrega exitosa! ${data.total_etiquetas} etiquetas entregadas a ${data.exitos} empleados.`
        });
      }
      
      setCantidad(50);
      setObservacion('');
      await buscarEmpleados();
      
      setTimeout(() => setMensaje(null), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar entregas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Entregar Etiquetas</h1>

      {mensaje && (
        <div className={`${mensaje.tipo === 'success' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-yellow-100 border-yellow-400 text-yellow-700'} border px-4 py-3 rounded mb-4`}>
          {mensaje.texto}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Buscar Empleados</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigo}
            onChange={handleCodigoChange}
            onKeyPress={(e) => e.key === 'Enter' && buscarEmpleados()}
            placeholder="Códigos separados por coma (Ej: 20570, 30571, 40572)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={buscarEmpleados}
            disabled={loading || !codigo.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Tip:</strong> Ingresa varios códigos separados por coma para entregar a múltiples empleados a la vez.
        </p>
        <p className="text-sm text-gray-500 mt-1">Fecha: {hoy}</p>
      </div>

      {empleadosNoEncontrados.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-700 mb-2">Empleados no encontrados:</h3>
          <ul className="text-sm text-red-600">
            {empleadosNoEncontrados.map((emp, i) => (
              <li key={i}>• {emp.codigo} - {emp.razon}</li>
            ))}
          </ul>
        </div>
      )}

      {empleados.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Empleados Seleccionados ({empleados.length})</h2>
          
          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Código</th>
                  <th className="text-left py-2 px-2">Nombre</th>
                  <th className="text-center py-2 px-2">Entregadas</th>
                  <th className="text-center py-2 px-2">Escaneadas</th>
                  <th className="text-center py-2 px-2">Mermas</th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((emp) => {
                  const datosEmp = datos?.porEmpleado?.find(d => d.codigo === emp.codigo);
                  const mermasEmp = Math.max(0, (datosEmp?.entregado || 0) - (datosEmp?.escaneados || 0));
                  return (
                    <tr key={emp.codigo} className="border-b">
                      <td className="py-2 px-2 font-mono">{emp.id_empleado}</td>
                      <td className="py-2 px-2">{emp.nom_empleado}</td>
                      <td className="py-2 px-2 text-center text-blue-600 font-semibold">
                        {loadingDatos ? '...' : (datosEmp?.entregado || 0)}
                      </td>
                      <td className="py-2 px-2 text-center text-green-600 font-semibold">
                        {loadingDatos ? '...' : (datosEmp?.escaneados || 0)}
                      </td>
                      <td className={`py-2 px-2 text-center font-semibold ${mermasEmp > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {loadingDatos ? '...' : mermasEmp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="py-2 px-2" colSpan={2}>TOTAL</td>
                  <td className="py-2 px-2 text-center text-blue-600">{datos?.totalEntregado || 0}</td>
                  <td className="py-2 px-2 text-center text-green-600">{datos?.totalEscaneado || 0}</td>
                  <td className="py-2 px-2 text-center text-red-600">{datos?.mermas || 0}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Cantidad por empleado
              </label>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-center bg-blue-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total a entregar</p>
                <p className="text-2xl font-bold text-blue-600">{empleados.length * cantidad}</p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">
              Observación (opcional)
            </label>
            <textarea
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Ej: Entrega grupal por turno matutino"
              rows={2}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => navigate('/consulta')}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-medium"
            >
              Ver Consulta
            </button>
            <button
              onClick={handleEntregar}
              disabled={loading || cantidad <= 0}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Registrando...' : `Entregar ${empleados.length * cantidad} Etiquetas`}
            </button>
          </div>
        </div>
      )}

      {empleados.length === 0 && !loading && codigo.trim() && (
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          Ingresa uno o más códigos de empleado separados por coma y presiona Buscar
        </div>
      )}
    </div>
  );
}

export default Entregar;
