import bcrypt from 'bcrypt'
import type { User } from '@philosophy/shared'
import { query } from './pool'

interface UserRow {
  id: number
  username: string
  password_hash: string
}

function rowToUser(row: UserRow): User {
  return { id: row.id, username: row.username }
}

export async function findUserByUsername(username: string): Promise<(User & { passwordHash: string }) | null> {
  const result = await query<UserRow>(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username],
  )
  const row = result.rows[0]
  if (!row) return null
  return { ...rowToUser(row), passwordHash: row.password_hash }
}

export async function findUserById(id: number): Promise<User | null> {
  const result = await query<UserRow>(
    'SELECT id, username, password_hash FROM users WHERE id = $1',
    [id],
  )
  const row = result.rows[0]
  if (!row) return null
  return rowToUser(row)
}

export async function countUsers(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM users')
  return Number(result.rows[0]?.count ?? 0)
}

export async function createUser(username: string, password: string): Promise<User> {
  const passwordHash = await bcrypt.hash(password, 10)
  const result = await query<UserRow>(
    `INSERT INTO users (username, password_hash) VALUES ($1, $2)
     RETURNING id, username, password_hash`,
    [username, passwordHash],
  )
  return rowToUser(result.rows[0])
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash)
}
