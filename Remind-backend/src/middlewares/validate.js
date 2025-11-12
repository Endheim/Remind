const validate =
  (schema) =>
  (req, res, next) => {
    try {
      req.validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return res.status(400).json({
        message: 'Validation failed',
        issues: error.errors?.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
  };

module.exports = { validate };
