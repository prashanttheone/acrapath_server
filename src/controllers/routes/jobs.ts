import { Router } from 'express';
import { createJobPost, getJobs, getJobById } from '../jobs/job_controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Routes for Job Posts
router.post('/', requireAuth, createJobPost);
router.get('/', getJobs);
router.get('/:id', getJobById);

export default router;
