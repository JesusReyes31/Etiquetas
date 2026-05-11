function EmpleadoCard({ empleado, onClick, onRegistrarMerma }) {
  const tieneAlerta = empleado.mermas > 0;

  return (
    <div 
      className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
        tieneAlerta ? 'border-l-4 border-yellow-500' : 'border-l-4 border-green-500'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{empleado.nombre}</p>
          <p className="text-gray-500 text-sm">Código: {empleado.codigo}</p>
        </div>
        {tieneAlerta && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
            ⚠️ {empleado.mermas} mermas
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-blue-50 rounded p-2">
          <p className="text-xs text-gray-500">Entregadas</p>
          <p className="text-xl font-bold text-blue-600">{empleado.entregadas}</p>
        </div>
        <div className="bg-green-50 rounded p-2">
          <p className="text-xs text-gray-500">Escaneadas</p>
          <p className="text-xl font-bold text-green-600">{empleado.escaneadas}</p>
        </div>
        <div className={`rounded p-2 ${tieneAlerta ? 'bg-red-50' : 'bg-gray-50'}`}>
          <p className="text-xs text-gray-500">Mermas</p>
          <p className={`text-xl font-bold ${tieneAlerta ? 'text-red-600' : 'text-gray-600'}`}>
            {empleado.mermas}
          </p>
        </div>
      </div>

      {tieneAlerta && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRegistrarMerma(empleado);
          }}
          className="mt-3 w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium py-2 rounded transition-colors"
        >
          Registrar Merma
        </button>
      )}
    </div>
  );
}

export default EmpleadoCard;
