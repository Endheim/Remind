## Re:Mind Monorepo

AI 기반 감정 회고 서비스의 프론트엔드/백엔드를 하나의 저장소에서 관리합니다.

### 구조

- `Remind-frontend/` – React (CRA) 기반 클라이언트
- `Remind-backend/` – Express + PostgreSQL API 서버

### 빠른 시작

```bash
# Frontend
cd Remind-frontend
npm install
npm start

# Backend
cd Remind-backend
npm install
cp .env.example .env  # 후 환경변수 수정
# (배포: CLIENT_ORIGIN=https://remind.ngrok.io, SERVER_PUBLIC_URL=https://remind-backend.ngrok.io 등)
psql remind < migrations/001_init.sql   # 또는 docker exec 등으로 실행
npm run dev
```

PostgreSQL 컨테이너 예시:

```bash
docker run -d \
  --name remind-postgres \
  -e POSTGRES_USER=remind \
  -e POSTGRES_PASSWORD=remind1234 \
  -e POSTGRES_DB=remind \
  -p 5432:5432 \
  postgres:16
```

### 주요 기능

- AI 감정 분석/코칭/리포트 API
- 회고 생성·조회 및 감정 통계
- 이메일+비밀번호 기반 회원가입/로그인, JWT 인증

환경 변수를 통한 프런트/백엔드 URL 매핑:

- `Remind-backend/.env` → `CLIENT_ORIGIN=https://remind.ngrok.io`, `SERVER_PUBLIC_URL=https://remind-backend.ngrok.io`
- `Remind-frontend/.env` → `REACT_APP_API_BASE_URL=https://remind-backend.ngrok.io`

자세한 API 설명은 `Remind-backend/README.md`와 각 `src/routes` 폴더를 참고하세요.
