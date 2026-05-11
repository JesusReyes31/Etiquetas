import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Entregar from './pages/Entregar';
import Empleados from './pages/Empleados';
import Mermas from './pages/Mermas';
import Reportes from './pages/Reportes';
import Configuracion from './pages/Configuracion';
import ConsultaEmpleado from './pages/ConsultaEmpleado';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/consulta" element={<ConsultaEmpleado />} />
            <Route path="/entregar" element={<Entregar />} />
            <Route path="/empleados" element={<Empleados />} />
            <Route path="/mermas" element={<Mermas />} />
            <Route path="/reportes" element={<Reportes />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
