const { Router } = require('express');
const { requireAuth } = require('../middlewares/auth');
const { requireProfileComplete } = require('../middlewares/requireProfileComplete');
const { validate } = require('../middlewares/validate');
const {
  createJournalSchema,
  listJournalSchema,
  updateJournalSchema,
  journalIdParamsSchema,
} = require('../validators/journalSchemas');
const journalService = require('../services/journalService');
const aiService = require('../services/aiService');

const router = Router();

router.use(requireAuth);
router.use(requireProfileComplete);

router.get('/', validate(listJournalSchema), async (req, res) => {
  const { query } = req.validated;
  const journals = await journalService.listJournals(req.user.sub, {
    limit: query.limit ?? 20,
    offset: query.offset ?? 0,
  });
  res.json({ journals });
});

router.get('/:id', async (req, res) => {
  const journal = await journalService.getJournal(req.user.sub, req.params.id);
  res.json({ journal });
});

router.post('/', validate(createJournalSchema), async (req, res) => {
  const {
    body: { content },
  } = req.validated;
  const analysis = await aiService.analyzeJournal(content);
  const journal = await journalService.createJournal(req.user.sub, {
    content,
    ...analysis,
  });
  res.status(201).json({ journal });
});

router.patch('/:id', validate(updateJournalSchema), async (req, res) => {
  const {
    params: { id },
    body: { content },
  } = req.validated;
  const analysis = await aiService.analyzeJournal(content);
  const journal = await journalService.updateJournal(req.user.sub, id, {
    content,
    ...analysis,
  });
  res.json({ journal });
});

router.delete('/:id', validate(journalIdParamsSchema), async (req, res) => {
  const {
    params: { id },
  } = req.validated;
  await journalService.deleteJournal(req.user.sub, id);
  res.status(204).end();
});

module.exports = router;
