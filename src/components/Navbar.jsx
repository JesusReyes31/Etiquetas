import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/consulta', label: 'Consulta', icon: '🔍' },
  { path: '/entregar', label: 'Entregar', icon: '➕' },
  { path: '/mermas', label: 'Mermas', icon: '⚠️' },
  { path: '/reportes', label: 'Reportes', icon: '📈' },
  { path: '/configuracion', label: 'Config', icon: '⚙️' }
];

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🏷️</span>
            <span className="font-bold text-xl">Control de Etiquetas</span>
          </div>
          <div className="flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                }`}
              >
                <span className="mr-1">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
