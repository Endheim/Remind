const { hashPassword, comparePassword } = require('../utils/password');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');
const userService = require('./userService');
const { createError } = require('../utils/errors');

const issueTokens = (user) => {
  const payload = { sub: user.id, email: user.email };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user,
  };
};

const register = async ({ email, password, nickname }) => {
  const existing = await userService.findByEmail(email);
  if (existing) {
    throw createError(409, 'Email already registered');
  }
  const passwordHash = await hashPassword(password);
  const user = await userService.createUser({
    email,
    passwordHash,
    nickname,
    profileComplete: true,
  });
  return issueTokens(user);
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const login = async ({ identifier, password }) => {
  const trimmed = identifier?.trim();
  if (!trimmed) {
    throw createError(400, '아이디 또는 이메일을 입력해 주세요.');
  }

  const existing = isEmail(trimmed)
    ? await userService.findByEmail(trimmed)
    : await userService.findByNickname(trimmed);
  if (!existing) {
    throw createError(401, 'Invalid credentials');
  }
  const passwordMatch = await comparePassword(password, existing.password_hash);
  if (!passwordMatch) {
    throw createError(401, 'Invalid credentials');
  }
  const user = userService.mapUser(existing);
  return issueTokens(user);
};

const refresh = async ({ token }) => {
  try {
    const decoded = verifyRefreshToken(token);
    const user = await userService.findById(decoded.sub);
    if (!user) {
      throw createError(401, 'Invalid refresh token');
    }
    return issueTokens(user);
  } catch (error) {
    throw createError(401, 'Invalid refresh token');
  }
};

const generateRandomPassword = () =>
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

const ensureNickname = ({ nickname, email, providerId }) => {
  if (nickname) return nickname;
  if (email) {
    const [localPart] = email.split('@');
    if (localPart) {
      return localPart.slice(0, 20);
    }
  }
  return `user-${providerId.slice(0, 8)}`;
};

const loginWithProvider = async ({
  provider,
  providerId,
  email,
  nickname,
}) => {
  if (!providerId) {
    throw createError(400, 'Missing provider identifier');
  }

  let user =
    provider === 'google'
      ? await userService.findByGoogleId(providerId)
      : await userService.findByNaverId(providerId);

  if (!user && email) {
    const existing = await userService.findByEmail(email);
    if (existing) {
      if (provider === 'google') {
        await userService.linkGoogleAccount(existing.id, providerId);
      } else {
        await userService.linkNaverAccount(existing.id, providerId);
      }
      user = await userService.findById(existing.id);
    }
  }

  let isNew = false;

  if (!user) {
    isNew = true;
    if (!email) {
      throw createError(400, 'Email is required for new accounts');
    }
    const passwordHash = await hashPassword(generateRandomPassword());
    user = await userService.createUser({
      email,
      passwordHash,
      nickname: ensureNickname({ nickname, email, providerId }),
      googleId: provider === 'google' ? providerId : null,
      naverId: provider === 'naver' ? providerId : null,
      profileComplete: false,
    });
  }

  return {
    ...issueTokens(user),
    isNew,
  };
};

module.exports = {
  register,
  login,
  refresh,
  loginWithProvider,
};
