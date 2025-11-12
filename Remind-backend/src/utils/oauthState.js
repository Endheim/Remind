const jwt = require('jsonwebtoken');
const config = require('../config');

const signOauthState = (payload) =>
  jwt.sign(payload, config.security.refreshTokenSecret, {
    expiresIn: '10m',
  });

const verifyOauthState = (state) =>
  jwt.verify(state, config.security.refreshTokenSecret);

module.exports = {
  signOauthState,
  verifyOauthState,
};
