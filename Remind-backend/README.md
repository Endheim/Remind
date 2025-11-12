## Re:Mind Backend

Express + PostgreSQL API server for the Re:Mind journaling platform.

### Requirements

- Node.js 18+
- PostgreSQL 16 (see `migrations/001_init.sql`)
- `docker` (optional) – sample command in main project description

### Setup

```bash
cd Remind-backend
npm install
cp .env.example .env
# Update secrets & database URL if needed
```

Run migrations manually (e.g., using `psql -f migrations/001_init.sql`).

### Development

```bash
npm run dev
```

Server defaults to `http://localhost:4000`.

### Environment

- `DATABASE_URL`: PostgreSQL connection string (Docker sample below)
- `CLIENT_ORIGIN`: Allowed CORS origin (ngrok frontend `https://remind.ngrok.io`)
- `SERVER_PUBLIC_URL`: External URL that proxies to the backend (`https://remind-backend.ngrok.io`)
- `JWT_*`: Secrets & TTL config
- `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `NAVER_CLIENT_ID/SECRET`

### Key Endpoints

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- `POST /journals`, `GET /journals`, `GET /journals/:id`
- `POST /ai/analyze`, `/ai/coach`, `/ai/report`, `/ai/moderate`
- `GET /emotions/summary`, `GET /emotions/timeline`

See `src/` for implementation details.
