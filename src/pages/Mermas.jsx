import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { useLocation } from 'react-router-dom';
import { empleadosAPI, ajustesAPI, reportesAPI } from '../api';

function Mermas() {
  const location = useLocation();
  
  const [empleados, setEmpleados] = useState([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(location.state?.empleado || null);
  const [fecha, setFecha] = useState(location.state?.fecha || format(new Date(), 'yyyy-MM-dd'));
  const [balance, setBalance] = useState(null);
  const [form, setForm] = useState({
    mermas: 0,
    decision: 'cobrar',
    observacion: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [codigoBusqueda, setCodigoBusqueda] = useState('');

  useEffect(() => {
    cargarEmpleados();
  }, []);

  useEffect(() => {
    if (empleadoSeleccionado) {
      cargarBalance();
    }
  }, [empleadoSeleccionado, fecha]);

  const cargarEmpleados = async () => {
    try {
      const response = await empleadosAPI.getAll();
      setEmpleados(response.data);
    } catch (err) {
      setError('Error al cargar empleados');
    }
  };

  const buscarPorCodigo = async () => {
    if (!codigoBusqueda.trim()) return;
    
    try {
      const response = await empleadosAPI.getByCodigo(codigoBusqueda);
      setEmpleadoSeleccionado(response.data);
      setError(null);
    } catch (err) {
      setError('Empleado no encontrado');
    }
  };

  const cargarBalance = async () => {
    setLoadingBalance(true);
    try {
      const resumenResponse = await reportesAPI.getBalanceEmpleado(empleadoSeleccionado.id, fecha);
      const balanceData = resumenResponse.data;
      setBalance(balanceData);
      setForm({ ...form, mermas: balanceData.mermas || 0 });
    } catch (err) {
      console.error('Error cargando balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (form.mermas <= 0) {
      setError('La cantidad de mermas debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      await ajustesAPI.create({
        empleado_id: empleadoSeleccionado.id,
        mermas: parseInt(form.mermas),
        decision: form.decision,
        fecha,
        observacion: form.observacion
      });

      setMensaje('Merma registrada correctamente');
      setForm({ mermas: 0, decision: 'cobrar', observacion: '' });
      cargarBalance();
      setTimeout(() => setMensaje(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar merma');
    } finally {
      setLoading(false);
    }
  };

  const costoTotal = form.mermas * (balance?.costo_por_etiqueta || 0.50);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Registrar Merma</h1>

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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Seleccionar Empleado</h2>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={codigoBusqueda}
            onChange={(e) => setCodigoBusqueda(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && buscarPorCodigo()}
            placeholder="Código del empleado"
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            onClick={buscarPorCodigo}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Buscar
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">O seleccionar de la lista:</label>
          <select
            value={empleadoSeleccionado?.id || ''}
            onChange={(e) => {
              const emp = empleados.find(em => em.id === parseInt(e.target.value));
              setEmpleadoSeleccionado(emp);
            }}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">-- Seleccionar empleado --</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.codigo} - {emp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {empleadoSeleccionado && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-6">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{empleadoSeleccionado.nombre}</h2>
              <p className="text-gray-500">Código: {empleadoSeleccionado.codigo}</p>
            </div>
          </div>

          {loadingBalance ? (
            <div className="text-center py-4">Cargando balance...</div>
          ) : balance && (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Entregadas</p>
                  <p className="text-2xl font-bold text-blue-600">{balance.entregadas}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Escaneadas</p>
                  <p className="text-2xl font-bold text-green-600">{balance.escaneadas}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500">Mermas</p>
                  <p className="text-2xl font-bold text-red-600">{balance.mermas}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Mermas a registrar
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.mermas}
                    onChange={(e) => setForm({ ...form, mermas: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Decisión</label>
                  <div className="space-y-2">
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="decision"
                        value="cobrar"
                        checked={form.decision === 'cobrar'}
                        onChange={(e) => setForm({ ...form, decision: e.target.value })}
                        className="mr-3"
                      />
                      <span className="font-medium">Cobrar al empleado</span>
                      {form.decision === 'cobrar' && (
                        <span className="ml-auto bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                          ${costoTotal.toFixed(2)}
                        </span>
                      )}
                    </label>
                    <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="decision"
                        value="desechar"
                        checked={form.decision === 'desechar'}
                        onChange={(e) => setForm({ ...form, decision: e.target.value })}
                        className="mr-3"
                      />
                      <span className="font-medium">Desechar (pérdida empresa)</span>
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={form.observacion}
                    onChange={(e) => setForm({ ...form, observacion: e.target.value })}
                    placeholder="Ej: Etiquetas caídas al piso y dañadas"
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar Decisión'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Mermas;
