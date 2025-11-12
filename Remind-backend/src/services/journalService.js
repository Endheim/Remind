const db = require('../db/pool');
const { createError } = require('../utils/errors');

const JOURNAL_COLUMNS = `
  id, user_id, content, emotion, emotion_score, summary,
  advice, moderation_verdict, moderation_confidence,
  created_at, updated_at
`;

const mapJournal = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    emotion: row.emotion,
    emotionScore: Number(row.emotion_score),
    summary: row.summary,
    advice: row.advice,
    moderationVerdict: row.moderation_verdict,
    moderationConfidence: Number(row.moderation_confidence),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

const createJournal = async (userId, data) => {
  const values = [
    userId,
    data.content,
    data.emotion,
    data.emotionScore,
    data.summary,
    data.advice,
    data.moderationVerdict,
    data.moderationConfidence,
  ];

  const { rows } = await db.query(
    `
      INSERT INTO journals (
        user_id, content, emotion, emotion_score, summary,
        advice, moderation_verdict, moderation_confidence
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING ${JOURNAL_COLUMNS}
    `,
    values
  );

  return mapJournal(rows[0]);
};

const listJournals = async (userId, { limit = 20, offset = 0 } = {}) => {
  const { rows } = await db.query(
    `
      SELECT ${JOURNAL_COLUMNS}
      FROM journals
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `,
    [userId, limit, offset]
  );
  return rows.map(mapJournal);
};

const getJournal = async (userId, journalId) => {
  const { rows } = await db.query(
    `
      SELECT ${JOURNAL_COLUMNS}
      FROM journals
      WHERE id = $1 AND user_id = $2
      LIMIT 1
    `,
    [journalId, userId]
  );
  const journal = mapJournal(rows[0]);
  if (!journal) {
    throw createError(404, 'Journal not found');
  }
  return journal;
};

const ensureJournalOwnership = async (userId, journalId) => {
  await getJournal(userId, journalId);
};

const updateJournal = async (userId, journalId, data) => {
  await ensureJournalOwnership(userId, journalId);
  const values = [
    data.content,
    data.emotion,
    data.emotionScore,
    data.summary,
    data.advice,
    data.moderationVerdict,
    data.moderationConfidence,
    journalId,
  ];

  const { rows } = await db.query(
    `
      UPDATE journals
      SET
        content = $1,
        emotion = $2,
        emotion_score = $3,
        summary = $4,
        advice = $5,
        moderation_verdict = $6,
        moderation_confidence = $7,
        updated_at = NOW()
      WHERE id = $8
      RETURNING ${JOURNAL_COLUMNS}
    `,
    values
  );

  const journal = mapJournal(rows[0]);
  return journal;
};

const deleteJournal = async (userId, journalId) => {
  await ensureJournalOwnership(userId, journalId);
  await db.query(`DELETE FROM journals WHERE id = $1`, [journalId]);
};

module.exports = {
  createJournal,
  listJournals,
  getJournal,
  updateJournal,
  deleteJournal,
};
