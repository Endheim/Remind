const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (payload) =>
  jwt.sign(payload, config.security.accessTokenSecret, {
    expiresIn: config.security.accessTokenTtl,
  });

const signRefreshToken = (payload) =>
  jwt.sign(payload, config.security.refreshTokenSecret, {
    expiresIn: config.security.refreshTokenTtl,
  });

const verifyAccessToken = (token) =>
  jwt.verify(token, config.security.accessTokenSecret);

const verifyRefreshToken = (token) =>
  jwt.verify(token, config.security.refreshTokenSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
