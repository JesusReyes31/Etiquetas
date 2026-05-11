import { Router } from 'express';
import * as entregaController from '../controllers/entregaController.js';
import * as mermaService from '../services/mermaService.js';
import { getConfig } from '../services/sys21Service.js';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { empleado_id, cantidad } = req.body;
    
    if (!empleado_id || !cantidad) {
      return res.status(400).json({ 
        error: 'empleado_id y cantidad son requeridos' 
      });
    }

    const fecha = new Date().toISOString().split('T')[0];
    const balance = await mermaService.getBalanceEmpleado(empleado_id, fecha);
    
    const valido = !balance.tiene_alerta || cantidad <= 0;
    
    res.json({
      valido,
      balance,
      mensaje: valido 
        ? 'Empleado puede recibir más etiquetas' 
        : `Alerta: El empleado tiene ${balance.mermas} mermas sin justificar`,
      puede_entregar: valido,
      requiere_confirmacion: balance.tiene_alerta && cantidad > 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
