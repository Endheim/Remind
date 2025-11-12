const config = require('../config');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message =
    err.message || 'Unexpected error. Please try again later.';

  const payload = { message };
  if (config.env !== 'production' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
};

module.exports = { errorHandler };
