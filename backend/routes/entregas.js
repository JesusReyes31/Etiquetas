import { Router } from 'express';
import * as entregaController from '../controllers/entregaController.js';

const router = Router();

router.get('/', entregaController.getAll);
router.get('/resumen', entregaController.getResumenDelDia);
router.get('/codigo/:codigo', entregaController.getByCodigo);
router.get('/:empleadoId', entregaController.getByEmpleado);
router.post('/', entregaController.create);
router.post('/batch', entregaController.createBatch);

export default router;
