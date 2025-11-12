const config = require('../config');
const { createError } = require('../utils/errors');

const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_PROFILE_ENDPOINT =
  'https://www.googleapis.com/oauth2/v2/userinfo';

const NAVER_AUTH_ENDPOINT = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_TOKEN_ENDPOINT = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_ENDPOINT = 'https://openapi.naver.com/v1/nid/me';

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      throw createError(response.status, 'Invalid response from OAuth provider');
    }
  }
  if (!response.ok) {
    const message =
      data?.error_description ||
      data?.error ||
      data?.message ||
      'OAuth provider error';
    throw createError(response.status, message);
  }
  return data;
};

const ensureGoogleConfig = () => {
  if (!config.oauth.googleClientId || !config.oauth.googleClientSecret) {
    throw createError(503, 'Google OAuth is not configured');
  }
};

const ensureNaverConfig = () => {
  if (!config.oauth.naverClientId || !config.oauth.naverClientSecret) {
    throw createError(503, 'Naver OAuth is not configured');
  }
};

const buildGoogleAuthUrl = ({ state, redirectUri }) => {
  ensureGoogleConfig();
  const params = new URLSearchParams({
    client_id: config.oauth.googleClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
};

const exchangeGoogleCode = async ({ code, redirectUri }) => {
  ensureGoogleConfig();
  const params = new URLSearchParams({
    code,
    client_id: config.oauth.googleClientId,
    client_secret: config.oauth.googleClientSecret,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  return fetchJson(GOOGLE_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
};

const fetchGoogleProfile = async ({ accessToken }) => {
  const data = await fetchJson(GOOGLE_PROFILE_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return {
    id: data.id,
    email: data.email,
    name: data.name || data.given_name || data.family_name,
    picture: data.picture,
  };
};

const buildNaverAuthUrl = ({ state, redirectUri }) => {
  ensureNaverConfig();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.oauth.naverClientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${NAVER_AUTH_ENDPOINT}?${params.toString()}`;
};

const exchangeNaverCode = async ({ code, state, redirectUri }) => {
  ensureNaverConfig();
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: config.oauth.naverClientId,
    client_secret: config.oauth.naverClientSecret,
    code,
    state,
    redirect_uri: redirectUri,
  });

  return fetchJson(NAVER_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
};

const fetchNaverProfile = async ({ accessToken }) => {
  const response = await fetchJson(NAVER_PROFILE_ENDPOINT, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.resultcode !== '00' || !response.response) {
    throw createError(400, 'Failed to fetch Naver profile');
  }

  const profile = response.response;
  return {
    id: profile.id,
    email: profile.email,
    name: profile.name || profile.nickname,
    nickname: profile.nickname,
    profileImage: profile.profile_image,
  };
};

module.exports = {
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  fetchGoogleProfile,
  buildNaverAuthUrl,
  exchangeNaverCode,
  fetchNaverProfile,
};
