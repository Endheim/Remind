const db = require('../db/pool');

const getWeeklySummary = async (userId) => {
  const { rows } = await db.query(
    `
      SELECT emotion, COUNT(*)::int AS count
      FROM journals
      WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY emotion
    `,
    [userId]
  );

  const summary = { positive: 0, neutral: 0, negative: 0 };
  rows.forEach((row) => {
    summary[row.emotion] = row.count;
  });
  return summary;
};

const getTimeline = async (userId) => {
  const { rows } = await db.query(
    `
      SELECT
        DATE(created_at) AS date,
        emotion,
        AVG(emotion_score)::float AS avg_score,
        COUNT(*)::int AS entries
      FROM journals
      WHERE user_id = $1
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at), emotion
      ORDER BY date DESC
    `,
    [userId]
  );
  return rows.map((row) => ({
    date: row.date,
    emotion: row.emotion,
    avgScore: Number(row.avg_score),
    entries: row.entries,
  }));
};

module.exports = {
  getWeeklySummary,
  getTimeline,
};
