import { Router } from 'express';
import { register } from '../controllers/auth/register.js';
import { login } from '../controllers/auth/login.js';
import { updateFcmToken, deleteFcmToken } from '../controllers/auth/fcm_controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/fcm-token', requireAuth, updateFcmToken);
router.delete('/fcm-token', requireAuth, deleteFcmToken);

export default router;
