const app = require('./app');
const config = require('./config');
const { pool } = require('./db/pool');

const start = async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(config.port, () => {
      console.log(`Re:Mind API running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

start();
