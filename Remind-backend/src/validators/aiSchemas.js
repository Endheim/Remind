const { z } = require('zod');

const contentSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(500),
  }),
});

const reportSchema = z.object({
  body: z.object({
    weekStart: z
      .string()
      .datetime()
      .optional(),
  }),
});

module.exports = {
  contentSchema,
  reportSchema,
};
