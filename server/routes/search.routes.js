import express from 'express';
import { 
  searchTasks, 
  saveSearchFilter, 
  getSavedFilters, 
  deleteSavedFilter 
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/tasks', searchTasks);
router.post('/filters', saveSearchFilter);
router.get('/filters', getSavedFilters);
router.delete('/filters/:filterId', deleteSavedFilter);

export default router;