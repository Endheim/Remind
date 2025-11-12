const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, '비밀번호는 8자 이상으로 입력해 주세요.'),
    nickname: z.string().min(2).max(20),
    consentPrivacy: z.literal(true, {
      errorMap: () => ({ message: '개인정보 수집 및 이용에 동의해 주세요.' }),
    }),
    consentDataTransfer: z.literal(true, {
      errorMap: () => ({ message: '개인정보 국외 이전에 동의해 주세요.' }),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    identifier: z
      .string()
      .trim()
      .min(2, '아이디 또는 이메일을 입력해 주세요.')
      .max(64),
    password: z.string().min(8),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

const profileSchema = z.object({
  body: z.object({
    nickname: z.string().min(2).max(20),
    profileComplete: z.boolean().optional(),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  profileSchema,
};
