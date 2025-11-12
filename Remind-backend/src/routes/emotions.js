const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { requireProfileComplete } = require('../middlewares/requireProfileComplete');
const emotionService = require('../services/emotionService');

const router = Router();

router.use(requireAuth);
router.use(requireProfileComplete);

router.get('/summary', async (req, res) => {
  const summary = await emotionService.getWeeklySummary(req.user.sub);
  res.json({ summary });
});

router.get('/timeline', async (req, res) => {
  const timeline = await emotionService.getTimeline(req.user.sub);
  res.json({ timeline });
});

module.exports = router;
