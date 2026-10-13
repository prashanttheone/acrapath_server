import { Router } from 'express';
import authRoutes from './auth.js';
import jobRoutes from './jobs.js';
import searchRoutes from './search.js';
import orderRoutes from './order.js';

const router = Router();

// Mount all route modules here
router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/orders', orderRoutes);
router.use('/', searchRoutes);

export default router;
