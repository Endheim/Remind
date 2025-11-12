const { z } = require('zod');

const contentSchema = z.object({
  content: z.string().min(1).max(500),
});

const createJournalSchema = z.object({
  body: contentSchema,
});

const journalIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('유효한 회고 ID를 입력해 주세요.'),
  }),
});

const updateJournalSchema = journalIdParamsSchema.extend({
  body: contentSchema,
});

const listJournalSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => Number.isFinite(val) && val > 0 && val <= 100, {
        message: 'limit must be between 1-100',
      })
      .optional(),
    offset: z
      .string()
      .transform((val) => Number(val))
      .refine((val) => Number.isFinite(val) && val >= 0, {
        message: 'offset must be >= 0',
      })
      .optional(),
  }),
});

module.exports = {
  createJournalSchema,
  listJournalSchema,
  updateJournalSchema,
  journalIdParamsSchema,
};
