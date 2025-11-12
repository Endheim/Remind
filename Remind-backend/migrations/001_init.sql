-- Enumerations
CREATE TYPE emotion_label AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE moderation_verdict AS ENUM ('allow', 'review', 'block');
CREATE TYPE user_status AS ENUM ('active', 'soft_deleted', 'banned');

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    nickname TEXT NOT NULL,
    intro TEXT DEFAULT '',
    avatar_url TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'active',
    google_id TEXT UNIQUE,
    naver_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Journals
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emotion emotion_label NOT NULL,
    emotion_score NUMERIC(4,2) NOT NULL,
    summary TEXT NOT NULL,
    advice TEXT NOT NULL,
    moderation_verdict moderation_verdict NOT NULL,
    moderation_confidence NUMERIC(4,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    CONSTRAINT journals_content_len CHECK (char_length(content) BETWEEN 1 AND 500)
);

-- Emotion scores
CREATE TABLE IF NOT EXISTS emotion_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES journals(id) ON DELETE CASCADE,
    label emotion_label NOT NULL,
    score NUMERIC(4,2) NOT NULL,
    keywords TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    summary TEXT NOT NULL,
    highlight TEXT,
    positivity NUMERIC(4,2),
    negativity NUMERIC(4,2),
    stability NUMERIC(4,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, week_start)
);

-- Moderation logs
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    action moderation_verdict NOT NULL,
    reason TEXT,
    confidence NUMERIC(4,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_journals_user_created_at ON journals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journals_created_at ON journals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_scores_journal ON emotion_scores(journal_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_week ON reports(user_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_target ON moderation_logs(target_id, target_type);
