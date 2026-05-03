import { Router, Request, Response, NextFunction } from 'express';
import * as apiController from '../controllers/apiController';

const router = Router();

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.user?.id) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
};

router.get('/health', apiController.healthCheck);
router.get('/test', (req, res) => res.json({ test: 'ok' }));
router.get('/auth/url', apiController.getAuthUrl);
router.get('/auth/callback', apiController.handleAuthCallback);
router.get('/auth/me', requireAuth, apiController.getMe);
router.post('/auth/logout', requireAuth, apiController.logout);
router.get('/dashboard', requireAuth, apiController.getDashboard);
router.post('/onboarding', requireAuth, apiController.handleOnboarding);
router.post('/parse-statement', requireAuth, apiController.parseStatement);
router.post('/ai/parse', apiController.parseFinancialIntent);
router.post('/chat', requireAuth, apiController.handleChat);
router.post('/save-strategy', requireAuth, apiController.saveStrategy);
router.post('/sync', requireAuth, apiController.syncFinancials);
router.post('/export', requireAuth, apiController.exportRoadmap);

export default router;
