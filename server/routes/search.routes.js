import express from 'express';
import { 
  searchTasksController, // Changed from searchTasks to searchTasksController
  saveSearchFilter, 
  getSavedFilters, 
  deleteSavedFilter 
} from '../controllers/search.controller.js';

const router = express.Router();

router.get('/tasks', searchTasksController); // Use searchTasksController here
router.post('/filters', saveSearchFilter);
router.get('/filters', getSavedFilters);
router.delete('/filters/:filterId', deleteSavedFilter);

export default router;