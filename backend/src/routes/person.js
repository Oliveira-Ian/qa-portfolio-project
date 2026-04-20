import express from 'express';
import { personController } from '../controllers/personController.js';

const router = express.Router();

router.get('/', personController.list);
router.get('/:id', personController.getById);
router.post('/', personController.create);
router.put('/:id', personController.update);
router.delete('/:id', personController.delete);

export default router;
