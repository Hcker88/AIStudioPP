import express from 'express';
import { db } from '../lib/db';
import { failedReasoning } from '../lib/schema';

const router = express.Router();

router.post('/api/feedback', async (req, res) => {
  const { userId, aiResponse, userFeedback, context } = req.body;

  try {
    await db.insert(failedReasoning).values({
      userId,
      aiResponse,
      userFeedback,
      context,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to save feedback:', error);
    res.status(500).json({ error: 'Failed to save feedback' });
  }
});

export default router;
