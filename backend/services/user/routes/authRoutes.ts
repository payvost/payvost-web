
import { Router } from 'express';
import { register, trackLogin } from '../controllers/userController';

const router = Router();

router.post('/register', register);
router.post('/track-login', trackLogin);

export default router;
