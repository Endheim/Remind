const db = require('../db/pool');

const PUBLIC_USER_COLUMNS = `
  id, email, nickname, intro, avatar_url, is_private,
  status, google_id, naver_id, created_at, updated_at, profile_complete
`;

const mapUser = (row) => {
  if (!row) return null;
  const {
    id,
    email,
    nickname,
    intro,
    avatar_url,
    is_private,
    status,
    google_id,
    naver_id,
    created_at,
    updated_at,
    profile_complete,
  } = row;

  return {
    id,
    email,
    nickname,
    intro,
    avatarUrl: avatar_url,
    isPrivate: is_private,
    status,
    googleId: google_id,
    naverId: naver_id,
    createdAt: created_at,
    updatedAt: updated_at,
    profileComplete: profile_complete,
  };
};

const findByEmail = async (email) => {
  const { rows } = await db.query(
    `SELECT *, password_hash FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

const findByNickname = async (nickname) => {
  const { rows } = await db.query(
    `SELECT *, password_hash FROM users WHERE LOWER(nickname) = LOWER($1) LIMIT 1`,
    [nickname]
  );
  return rows[0] || null;
};

const findByGoogleId = async (googleId) => {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE google_id = $1 LIMIT 1`,
    [googleId]
  );
  return mapUser(rows[0]);
};

const findByNaverId = async (naverId) => {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE naver_id = $1 LIMIT 1`,
    [naverId]
  );
  return mapUser(rows[0]);
};

const findById = async (id) => {
  const { rows } = await db.query(
    `SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return mapUser(rows[0]);
};

const createUser = async ({
  email,
  passwordHash,
  nickname,
  googleId = null,
  naverId = null,
  profileComplete = false,
}) => {
  const { rows } = await db.query(
    `
      INSERT INTO users (email, password_hash, nickname, google_id, naver_id, profile_complete)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${PUBLIC_USER_COLUMNS}
    `,
    [email, passwordHash, nickname, googleId, naverId, profileComplete]
  );
  return mapUser(rows[0]);
};

const linkGoogleAccount = async (userId, googleId) => {
  await db.query(
    `UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2`,
    [googleId, userId]
  );
};

const linkNaverAccount = async (userId, naverId) => {
  await db.query(
    `UPDATE users SET naver_id = $1, updated_at = NOW() WHERE id = $2`,
    [naverId, userId]
  );
};

const updateProfile = async (userId, { nickname, profileComplete }) => {
  const updates = [];
  const values = [userId];

  if (typeof nickname === 'string') {
    updates.push(`nickname = $${values.length + 1}`);
    values.push(nickname);
  }

  if (typeof profileComplete === 'boolean') {
    updates.push(`profile_complete = $${values.length + 1}`);
    values.push(profileComplete);
  }

  if (!updates.length) {
    return findById(userId);
  }

  const setClause = `${updates.join(', ')}, updated_at = NOW()`;
  const { rows } = await db.query(
    `
      UPDATE users
      SET ${setClause}
      WHERE id = $1
      RETURNING ${PUBLIC_USER_COLUMNS}
    `,
    values
  );
  return mapUser(rows[0]);
};

const updateTimestamps = async (id) => {
  await db.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [id]);
};

module.exports = {
  findByEmail,
  findByNickname,
  findById,
  createUser,
  updateTimestamps,
  mapUser,
  findByGoogleId,
  findByNaverId,
  linkGoogleAccount,
  linkNaverAccount,
  updateProfile,
};
