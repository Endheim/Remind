const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { requireProfileComplete } = require('../middlewares/requireProfileComplete');
const { validate } = require('../middlewares/validate');
const { contentSchema, reportSchema } = require('../validators/aiSchemas');
const aiService = require('../services/aiService');

const router = Router();

router.use(requireAuth);
router.use(requireProfileComplete);

router.post(
  '/analyze',
  validate(contentSchema),
  async (req, res) => {
    const {
      body: { content },
    } = req.validated;
    const result = aiService.analyzeJournal(content);
    res.json(result);
  }
);

router.post('/coach', validate(contentSchema), async (req, res) => {
  const {
    body: { content },
  } = req.validated;
  const result = aiService.coach(content);
  res.json(result);
});

router.post('/report', validate(reportSchema), async (req, res) => {
  const report = aiService.fakeReport();
  res.json(report);
});

router.post('/moderate', validate(contentSchema), async (req, res) => {
  const {
    body: { content },
  } = req.validated;
  const result = aiService.moderateContent(content);
  res.json(result);
});

module.exports = router;
