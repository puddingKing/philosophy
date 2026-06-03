import { FastifyInstance } from 'fastify'
import path from 'path'
import fs from 'fs'
import { pipeline } from 'stream/promises'
import { createWriteStream } from 'fs'
import { config } from '../config'
import {
  listPhilosophers,
  getPhilosopherById,
  createPhilosopher,
  updatePhilosopher,
  deletePhilosopher,
  updateAvatarUrl,
  philosopherExists,
} from '../db/philosophers'
import { requireAuth } from '../middleware/auth'

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

export async function philosopherRoutes(fastify: FastifyInstance) {
  fastify.get('/api/philosophers', async () => {
    return listPhilosophers()
  })

  fastify.get<{ Params: { id: string } }>('/api/philosophers/:id', async (request, reply) => {
    const philosopher = await getPhilosopherById(request.params.id)
    if (!philosopher) {
      return reply.status(404).send({ error: 'Philosopher not found' })
    }
    return philosopher
  })

  fastify.post<{ Body: Record<string, unknown> }>(
    '/api/philosophers',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = request.body as {
        id?: string
        name?: string
        nameEn?: string
        era?: string
        school?: string
        summary?: string
        biography?: string
        works?: { title: string; year?: string; description?: string }[]
      }

      if (!body.id || !body.name) {
        return reply.status(400).send({ error: 'id and name are required' })
      }

      if (!/^[a-z0-9-]+$/.test(body.id)) {
        return reply.status(400).send({ error: 'id must be lowercase letters, numbers, or hyphens' })
      }

      if (await philosopherExists(body.id)) {
        return reply.status(409).send({ error: 'Philosopher id already exists' })
      }

      const philosopher = await createPhilosopher({
        id: body.id,
        name: body.name,
        nameEn: body.nameEn,
        era: body.era,
        school: body.school,
        summary: body.summary,
        biography: body.biography,
        works: body.works,
      })

      return reply.status(201).send(philosopher)
    },
  )

  fastify.put<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/api/philosophers/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const body = request.body as {
        name?: string
        nameEn?: string
        era?: string
        school?: string
        summary?: string
        biography?: string
        works?: { title: string; year?: string; description?: string }[]
      }

      const philosopher = await updatePhilosopher(request.params.id, body)
      if (!philosopher) {
        return reply.status(404).send({ error: 'Philosopher not found' })
      }
      return philosopher
    },
  )

  fastify.delete<{ Params: { id: string } }>(
    '/api/philosophers/:id',
    { preHandler: requireAuth },
    async (request, reply) => {
      const deleted = await deletePhilosopher(request.params.id)
      if (!deleted) {
        return reply.status(404).send({ error: 'Philosopher not found' })
      }
      return { success: true }
    },
  )

  fastify.post<{ Params: { id: string } }>(
    '/api/philosophers/:id/avatar',
    { preHandler: requireAuth },
    async (request, reply) => {
      const { id } = request.params
      if (!(await philosopherExists(id))) {
        return reply.status(404).send({ error: 'Philosopher not found' })
      }

      const data = await request.file()
      if (!data) {
        return reply.status(400).send({ error: 'No file uploaded' })
      }

      const ext = path.extname(data.filename).toLowerCase() || '.jpg'
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
      if (!allowed.includes(ext)) {
        return reply.status(400).send({ error: 'Invalid file type. Allowed: jpg, png, webp, gif' })
      }

      const filename = `${id}-${Date.now()}${ext}`
      const filepath = path.join(UPLOAD_DIR, filename)
      await pipeline(data.file, createWriteStream(filepath))

      const avatarUrl = `${config.publicApiUrl.replace(/\/$/, '')}/uploads/${filename}`
      const philosopher = await updateAvatarUrl(id, avatarUrl)
      return philosopher
    },
  )
}
