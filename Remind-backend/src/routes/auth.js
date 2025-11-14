const { Router } = require('express');
const authService = require('../services/authService');
const userService = require('../services/userService');
const { validate } = require('../middlewares/validate');
const { requireAuth } = require('../middlewares/auth');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  profileSchema,
} = require('../validators/authSchemas');
const { createError } = require('../utils/errors');

const router = Router();

router.post('/register', validate(registerSchema), async (req, res) => {
  const {
    body: { email, password, nickname },
  } = req.validated;
  const result = await authService.register({ email, password, nickname });
  res.status(201).json(result);
});

router.post('/login', validate(loginSchema), async (req, res) => {
  const { body } = req.validated;
  const result = await authService.login(body);
  res.json(result);
});

router.post('/refresh', validate(refreshSchema), async (req, res) => {
  const {
    body: { refreshToken },
  } = req.validated;
  const result = await authService.refresh({ token: refreshToken });
  res.json(result);
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await userService.findById(req.user.sub);
  res.json({ user });
});

router.patch(
  '/profile',
  requireAuth,
  validate(profileSchema),
  async (req, res) => {
    const {
      body: { nickname, profileComplete },
    } = req.validated;
    const user = await userService.updateProfile(req.user.sub, {
      nickname,
      profileComplete,
    });
    res.json({ user });
  }
);

router.get('/nickname/check', async (req, res) => {
  const value = (req.query.value || '').trim();
  if (!value) {
    throw createError(400, '닉네임을 입력해 주세요.');
  }
  if (value.length < 2 || value.length > 20) {
    throw createError(400, '닉네임은 2~20자로 입력해 주세요.');
  }
  const existing = await userService.findByNickname(value);
  res.json({ available: !existing });
});

router.get('/email/check', async (req, res) => {
  const value = (req.query.value || '').trim();
  if (!value) {
    throw createError(400, '이메일 주소를 입력해 주세요.');
  }
  if (value.length < 8 || value.length > 64) {
    throw createError(
      400,
      '이메일 주소 길이는 8자에서 64자 사이여야 합니다.'
    );
  }
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    throw createError(400, '유효한 이메일 주소를 입력해 주세요.');
  }
  const existing = await userService.findByEmail(value);
  res.json({ available: !existing });
});

module.exports = router;
