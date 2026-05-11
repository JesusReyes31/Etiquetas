import { Router } from 'express';
import * as empleadoController from '../controllers/empleadoController.js';

const router = Router();

router.get('/', empleadoController.getAll);
router.get('/:id', empleadoController.getById);
router.get('/codigo/:codigo', empleadoController.getByCodigo);
router.post('/', empleadoController.create);
router.put('/:id', empleadoController.update);
router.delete('/:id', empleadoController.remove);

export default router;
