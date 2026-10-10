import { Router } from 'express';
import authRoutes from './auth.js';
import jobRoutes from './jobs.js';

const router = Router();

// Mount all route modules here
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
export default router;
