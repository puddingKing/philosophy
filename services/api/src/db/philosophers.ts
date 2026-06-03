import { v4 as uuidv4 } from 'uuid'
import type { Philosopher, Work } from '@philosophy/shared'
import { query } from './pool'

interface PhilosopherRow {
  id: string
  name: string
  name_en: string | null
  era: string | null
  school: string | null
  avatar_url: string | null
  summary: string | null
  biography: string | null
  created_at: Date
  updated_at: Date
}

interface WorkRow {
  id: string
  title: string
  year: string | null
  description: string | null
}

async function getWorksForPhilosopher(philosopherId: string): Promise<Work[]> {
  const result = await query<WorkRow>(
    `SELECT id, title, year, description FROM works
     WHERE philosopher_id = $1 ORDER BY sort_order ASC, title ASC`,
    [philosopherId],
  )
  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    year: row.year ?? undefined,
    description: row.description ?? undefined,
  }))
}

async function rowToPhilosopher(row: PhilosopherRow): Promise<Philosopher> {
  return {
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? undefined,
    era: row.era ?? undefined,
    school: row.school ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    summary: row.summary ?? undefined,
    biography: row.biography ?? undefined,
    works: await getWorksForPhilosopher(row.id),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

export async function listPhilosophers(): Promise<Philosopher[]> {
  const result = await query<PhilosopherRow>('SELECT * FROM philosophers ORDER BY name ASC')
  return Promise.all(result.rows.map(rowToPhilosopher))
}

export async function getPhilosopherById(id: string): Promise<Philosopher | null> {
  const result = await query<PhilosopherRow>('SELECT * FROM philosophers WHERE id = $1', [id])
  const row = result.rows[0]
  if (!row) return null
  return rowToPhilosopher(row)
}

export async function philosopherExists(id: string): Promise<boolean> {
  const result = await query('SELECT 1 FROM philosophers WHERE id = $1', [id])
  return result.rowCount !== null && result.rowCount > 0
}

export interface PhilosopherInput {
  id: string
  name: string
  nameEn?: string
  era?: string
  school?: string
  summary?: string
  biography?: string
  works?: { title: string; year?: string; description?: string }[]
}

export async function createPhilosopher(input: PhilosopherInput): Promise<Philosopher> {
  await query(
    `INSERT INTO philosophers (id, name, name_en, era, school, summary, biography)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.id,
      input.name,
      input.nameEn ?? null,
      input.era ?? null,
      input.school ?? null,
      input.summary ?? null,
      input.biography ?? null,
    ],
  )
  await replaceWorks(input.id, input.works ?? [])
  return (await getPhilosopherById(input.id))!
}

export async function updatePhilosopher(
  id: string,
  input: Partial<Omit<PhilosopherInput, 'id'>>,
): Promise<Philosopher | null> {
  if (!(await philosopherExists(id))) return null

  const current = (await getPhilosopherById(id))!
  await query(
    `UPDATE philosophers SET
      name = $2, name_en = $3, era = $4, school = $5,
      summary = $6, biography = $7, updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      input.name ?? current.name,
      input.nameEn !== undefined ? (input.nameEn ?? null) : (current.nameEn ?? null),
      input.era !== undefined ? (input.era ?? null) : (current.era ?? null),
      input.school !== undefined ? (input.school ?? null) : (current.school ?? null),
      input.summary !== undefined ? (input.summary ?? null) : (current.summary ?? null),
      input.biography !== undefined ? (input.biography ?? null) : (current.biography ?? null),
    ],
  )

  if (input.works !== undefined) {
    await replaceWorks(id, input.works)
  }

  return getPhilosopherById(id)
}

export async function updateAvatarUrl(id: string, avatarUrl: string): Promise<Philosopher | null> {
  if (!(await philosopherExists(id))) return null
  await query('UPDATE philosophers SET avatar_url = $2, updated_at = NOW() WHERE id = $1', [id, avatarUrl])
  return getPhilosopherById(id)
}

export async function deletePhilosopher(id: string): Promise<boolean> {
  const result = await query('DELETE FROM philosophers WHERE id = $1', [id])
  return (result.rowCount ?? 0) > 0
}

async function replaceWorks(
  philosopherId: string,
  works: { title: string; year?: string; description?: string }[],
) {
  await query('DELETE FROM works WHERE philosopher_id = $1', [philosopherId])
  for (let index = 0; index < works.length; index++) {
    const work = works[index]
    await query(
      `INSERT INTO works (id, philosopher_id, title, year, description, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        `${philosopherId}-work-${uuidv4()}`,
        philosopherId,
        work.title,
        work.year ?? null,
        work.description ?? null,
        index,
      ],
    )
  }
}

export async function countPhilosophers(): Promise<number> {
  const result = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM philosophers')
  return Number(result.rows[0]?.count ?? 0)
}
