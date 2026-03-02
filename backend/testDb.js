const pool = require('./src/config/db');

(async () => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    console.log('DB ping success', rows);
  } catch (err) {
    console.error('DB ping failed', err.message);
  } finally {
    process.exit();
  }
})();