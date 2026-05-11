import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { reportesAPI } from '../api';
import StatCard from '../components/StatCard';
import EmpleadoCard from '../components/EmpleadoCard';

function Dashboard() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
  const navigate = useNavigate();

  useEffect(() => {
    cargarDashboard();
  }, [fecha]);

  const cargarDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportesAPI.getDashboard(fecha);
      setDatos(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleEmpleadoClick = (empleado) => {
    navigate('/entregar', { state: { empleado } });
  };

  const handleRegistrarMerma = (empleado) => {
    navigate('/mermas', { state: { empleado, fecha } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Fecha"
          value={format(new Date(fecha), 'dd/MM/yyyy')}
          icon="📅"
          color="blue"
        />
        <StatCard
          title="Total Entregadas"
          value={datos?.total_entregado || 0}
          icon="🏷️"
          color="blue"
        />
        <StatCard
          title="Total Sys21"
          value={datos?.total_sys21 || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Mermas Totales"
          value={datos?.total_mermas || 0}
          icon="⚠️"
          color={datos?.total_mermas > 0 ? 'red' : 'green'}
        />
      </div>

      {datos?.empleados?.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Empleados ({datos.empleados.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datos.empleados.map((emp) => (
              <EmpleadoCard
                key={emp.id}
                empleado={emp}
                onClick={() => handleEmpleadoClick(emp)}
                onRegistrarMerma={handleRegistrarMerma}
              />
            ))}
          </div>
        </div>
      )}

      {datos?.empleados?.length === 0 && (
        <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-500">
          No hay entregas registradas para esta fecha
        </div>
      )}
    </div>
  );
}

export default Dashboard;
