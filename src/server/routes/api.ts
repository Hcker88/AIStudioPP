import { Router } from 'express';
import * as apiController from '../controllers/apiController';

const router = Router();

router.get('/health', apiController.healthCheck);
router.get('/test', (req, res) => res.json({ test: 'ok' }));
router.get('/auth/url', apiController.getAuthUrl);
router.get('/auth/callback', apiController.handleAuthCallback);
router.get('/auth/me', apiController.getMe);
router.post('/auth/logout', apiController.logout);
router.get('/dashboard/:userId', apiController.getDashboard);
router.post('/onboarding', apiController.handleOnboarding);
router.get('/onboarding/welcome', apiController.getWelcome);
router.get('/ai/context/:userId', apiController.getAIContext);
router.post('/chat', apiController.handleChat);
router.post('/save-strategy', apiController.saveStrategy);
router.post('/sync', apiController.syncFinancials);
router.post('/export', apiController.exportRoadmap);
router.get('/market-pulse', apiController.getMarketPulse);
router.get('/annual-report', apiController.getAnnualReport);
router.post('/feedback', apiController.saveFeedback);
router.post('/log-advice', apiController.logAdvice);
router.post('/follow-advice', apiController.markAdviceFollowed);

export default router;
