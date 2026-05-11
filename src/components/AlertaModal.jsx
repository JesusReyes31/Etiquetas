import { useState } from 'react';
import { format } from 'date-fns';

function AlertaModal({ isOpen, onClose, empleado, onConfirm, balance }) {
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  if (!isOpen || !empleado) return null;

  const handleConfirm = () => {
    onConfirm();
    setMostrarConfirmacion(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-3">⚠️</span>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Alerta de Merma</h3>
            <p className="text-gray-500 text-sm">{format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>{empleado.nombre}</strong> (Código: {empleado.codigo})
          </p>
          <p className="text-sm text-yellow-800 mt-2">
            Tiene <strong className="text-red-600">{balance?.mermas || empleado.mermas}</strong> etiquetas sin escanear.
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Entregadas:</p>
              <p className="font-bold">{balance?.entregadas || empleado.entregadas}</p>
            </div>
            <div>
              <p className="text-gray-500">Escaneadas:</p>
              <p className="font-bold">{balance?.escaneadas || empleado.escaneadas}</p>
            </div>
          </div>
        </div>

        {mostrarConfirmacion ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800 text-sm mb-3">
              ¿Está seguro de entregar más etiquetas a pesar de las mermas pendientes?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setMostrarConfirmacion(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-medium"
              >
                Sí, Entregar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium"
            >
              Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertaModal;
