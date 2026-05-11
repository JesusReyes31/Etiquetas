import { Router } from 'express';
import * as ajusteController from '../controllers/ajusteController.js';

const router = Router();

router.get('/', ajusteController.getAll);
router.get('/periodo', ajusteController.getMermasPeriodo);
router.post('/', ajusteController.create);

export default router;
