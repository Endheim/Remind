const { Router } = require('express');
const config = require('../config');
const authService = require('../services/authService');
const oauthProviders = require('../services/oauthProviderService');
const { createError } = require('../utils/errors');
const { signOauthState, verifyOauthState } = require('../utils/oauthState');

const router = Router();

const CLIENT_CALLBACK_PATH = '/oauth/callback';

const buildCallbackUrl = (provider) =>
  `${config.server.publicUrl}/auth/oauth/${provider}/callback`;

const getDefaultRedirect = () => `${config.client.origin}${CLIENT_CALLBACK_PATH}`;

const isAllowedRedirect = (value) => {
  if (!value) return false;
  try {
    const target = new URL(value);
    const allowed = new URL(config.client.origin);
    return target.origin === allowed.origin;
  } catch (error) {
    return false;
  }
};

const resolveRedirect = (requested) =>
  isAllowedRedirect(requested) ? requested : getDefaultRedirect();

const buildSuccessRedirect = ({ redirect, authResult, provider }) => {
  const target = new URL(redirect || getDefaultRedirect());
  const hashParams = new URLSearchParams({
    accessToken: authResult.accessToken,
    refreshToken: authResult.refreshToken,
    provider,
  });
  if (!authResult.user?.profileComplete) {
    hashParams.set('profileRequired', 'true');
    if (authResult.user?.email) {
      hashParams.set('profileEmail', authResult.user.email);
    }
  }
  target.hash = hashParams.toString();
  return target.toString();
};

const buildErrorRedirect = ({ redirect, message }) => {
  const target = new URL(redirect || `${config.client.origin}/login`);
  target.searchParams.set('oauth_error', message);
  return target.toString();
};

const handleOauthError = (res, { redirect, error }) => {
  console.error('OAuth error', error);
  const message =
    error?.message || '소셜 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  return res.redirect(
    buildErrorRedirect({
      redirect,
      message,
    })
  );
};

router.post('/google/token', async (req, res, next) => {
  try {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== 'string') {
      throw createError(400, 'Google access token is required');
    }
    const profile = await oauthProviders.fetchGoogleProfile({
      accessToken,
    });
    const authResult = await authService.loginWithProvider({
      provider: 'google',
      providerId: profile.id,
      email: profile.email,
      nickname: profile.name,
    });
    res.json({
      ...authResult,
      provider: 'google',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/naver/url', (req, res, next) => {
  try {
    const redirect = resolveRedirect(req.query.redirect);
    const state = signOauthState({ redirect, provider: 'naver' });
    const url = oauthProviders.buildNaverAuthUrl({
      state,
      redirectUri: buildCallbackUrl('naver'),
    });
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

router.get('/naver/start', (req, res, next) => {
  try {
    const redirect = resolveRedirect(req.query.redirect);
    const state = signOauthState({ redirect, provider: 'naver' });
    const url = oauthProviders.buildNaverAuthUrl({
      state,
      redirectUri: buildCallbackUrl('naver'),
    });
    res.redirect(url);
  } catch (error) {
    next(error);
  }
});

router.get('/naver/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      throw createError(400, 'Invalid Naver callback payload');
    }
    const payload = verifyOauthState(state);
    if (payload.provider !== 'naver') {
      throw createError(400, 'State mismatch');
    }
    const tokenResponse = await oauthProviders.exchangeNaverCode({
      code,
      state,
      redirectUri: buildCallbackUrl('naver'),
    });
    const profile = await oauthProviders.fetchNaverProfile({
      accessToken: tokenResponse.access_token,
    });
    const authResult = await authService.loginWithProvider({
      provider: 'naver',
      providerId: profile.id,
      email: profile.email,
      nickname: profile.nickname || profile.name,
    });
    return res.redirect(
      buildSuccessRedirect({
        redirect: payload.redirect,
        authResult,
        provider: 'naver',
      })
    );
  } catch (error) {
    const redirect = getDefaultRedirect();
    if (req.query.state) {
      try {
        const payload = verifyOauthState(req.query.state);
        return handleOauthError(res, {
          redirect: payload.redirect,
          error,
        });
      } catch (stateError) {
        return handleOauthError(res, { redirect, error });
      }
    }
    return handleOauthError(res, { redirect, error });
  }
});

module.exports = router;
