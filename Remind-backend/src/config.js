const dotenv = require('dotenv');

dotenv.config();

const port = Number(process.env.PORT) || 4000;

const config = {
  env: process.env.NODE_ENV || 'development',
  port,
  server: {
    publicUrl:
      process.env.SERVER_PUBLIC_URL || `http://localhost:${port}`,
  },
  client: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  },
  db: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://remind:remind1234@localhost:5432/remind',
  },
  security: {
    accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
    refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '30d',
    accessTokenSecret:
      process.env.JWT_ACCESS_SECRET || 'change-me-access-secret',
    refreshTokenSecret:
      process.env.JWT_REFRESH_SECRET || 'change-me-refresh-secret',
  },
  ai: {
    openAiKey: process.env.OPENAI_API_KEY,
  },
  oauth: {
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    naverClientId: process.env.NAVER_CLIENT_ID,
    naverClientSecret: process.env.NAVER_CLIENT_SECRET,
  },
};

module.exports = config;
