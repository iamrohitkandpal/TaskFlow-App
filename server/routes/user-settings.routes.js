import express from 'express';
import {
  getUserSettings,
  updateUserSettings
} from '../controllers/user-settings.controller.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', auth, getUserSettings);
router.put('/', auth, updateUserSettings);

export default router;