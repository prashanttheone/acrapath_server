import { Router } from 'express';
import { suggestLocations, suggestSkills, suggestDesignations } from '../controllers/jobs/search_controller.js';

const router = Router();

router.get('/locations/suggest', suggestLocations);
router.get('/skills/suggest', suggestSkills);
router.get('/designations/suggest', suggestDesignations);

export default router;
