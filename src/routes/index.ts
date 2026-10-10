import { Router } from 'express';
import authRoutes from './auth.js';
import jobRoutes from './jobs.js';
import searchRoutes from './search.js';

const router = Router();

// Mount all route modules here
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/', searchRoutes);

export default router;
