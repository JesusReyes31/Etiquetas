import { Router } from 'express';
import * as reporteController from '../controllers/reporteController.js';

const router = Router();

router.get('/dashboard', reporteController.dashboard);
router.get('/balance/:empleadoId', reporteController.balanceEmpleado);
router.get('/balance-codigo/:codigo', reporteController.balanceEmpleadoPorCodigo);
router.get('/historial', reporteController.historial);
router.get('/sys21', reporteController.sys21Data);

export default router;
