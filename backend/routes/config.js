import { Router } from 'express';
import * as configController from '../controllers/configController.js';

const router = Router();

router.get('/', configController.get);
router.put('/', configController.update);
router.post('/test-sys21', configController.testSys21);

export default router;
