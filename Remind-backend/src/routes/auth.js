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
  // 닉네임 중복을 허용하므로 항상 사용 가능으로 응답
  res.json({ available: true });
});

module.exports = router;
