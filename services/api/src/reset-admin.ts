import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from './db/pool'
import { config } from './config'

async function resetAdminPassword() {
  const username = config.adminUsername
  const password = config.adminPassword

  const hash = await bcrypt.hash(password, 10)
  const result = await pool.query(
    'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id',
    [hash, username],
  )

  if (result.rowCount === 0) {
    console.error(`User "${username}" not found. Start API once to seed admin user.`)
    process.exit(1)
  }

  console.log(`Admin password updated for user "${username}".`)
  console.log(`Use password from ADMIN_PASSWORD in services/api/.env`)
  await pool.end()
}

resetAdminPassword().catch((err) => {
  console.error('Failed to reset admin password:', err.message)
  process.exit(1)
})
