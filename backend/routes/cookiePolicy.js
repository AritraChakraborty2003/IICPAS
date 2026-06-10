import express from 'express';
import {
  getActiveCookiePolicy,
  getAllCookiePolicies,
  getCookiePolicyById,
  createCookiePolicy,
  updateCookiePolicy,
  activateCookiePolicy,
  deleteCookiePolicy
} from '../controllers/cookiePolicyController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

// Public routes
router.get('/', getActiveCookiePolicy);
router.get('/active', getActiveCookiePolicy);

// Admin routes
router.get('/admin/all', requireAuth, isAdmin, getAllCookiePolicies);
router.get('/admin/:id', requireAuth, isAdmin, getCookiePolicyById);
router.post('/admin/create', requireAuth, isAdmin, createCookiePolicy);
router.put('/admin/update/:id', requireAuth, isAdmin, updateCookiePolicy);
router.put('/admin/activate/:id', requireAuth, isAdmin, activateCookiePolicy);
router.delete('/admin/delete/:id', requireAuth, isAdmin, deleteCookiePolicy);

export default router;
