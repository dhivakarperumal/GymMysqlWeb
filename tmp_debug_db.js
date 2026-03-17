require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/src/config/db');

async function debug() {
  try {
    console.log("--- Users Sample ---");
    const [users] = await db.query("SELECT id, username, email, role FROM users LIMIT 5");
    console.log(users);

    console.log("\n--- Staff Sample ---");
    const [staff] = await db.query("SELECT id, name, email, userId FROM staff LIMIT 5");
    console.log(staff);

    console.log("\n--- Attendance Sample (Last 5) ---");
    const [attendance] = await db.query("SELECT id, member_id, trainer_id, check_in, check_out FROM attendance ORDER BY id DESC LIMIT 5");
    console.log(attendance);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
