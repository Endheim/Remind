const db = require('../db/pool');

const INSERT_QUERY = `
  INSERT INTO moderation_logs (
    target_type,
    target_id,
    action,
    reason,
    confidence,
    metadata
  )
  VALUES ($1, $2, $3, $4, $5, $6::jsonb)
  RETURNING
    id,
    target_type AS "targetType",
    target_id AS "targetId",
    action,
    reason,
    confidence::float AS confidence,
    metadata,
    created_at AS "createdAt"
`;

const createModerationLog = async ({
  targetType,
  targetId,
  action,
  reason = null,
  confidence = null,
  metadata = {},
}) => {
  const { rows } = await db.query(INSERT_QUERY, [
    targetType,
    targetId,
    action,
    reason,
    confidence,
    JSON.stringify(metadata),
  ]);
  return rows[0];
};

module.exports = {
  createModerationLog,
};
