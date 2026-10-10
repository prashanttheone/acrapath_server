import { Router } from 'express';
import { suggestLocations, suggestKeywords } from '../controllers/jobs/search_controller.js';

const router = Router();

router.get('/locations/suggest', suggestLocations);
router.get('/keywords/suggest', suggestKeywords);

export default router;
