import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import jwt from '@fastify/jwt'
import path from 'path'
import { config } from './config'
import { philosopherRoutes } from './routes/philosophers'
import { authRoutes } from './routes/auth'
import { seedDatabase } from './seed'
import { pool } from './db/pool'

async function main() {
  await seedDatabase()

  const fastify = Fastify({ logger: true })

  await fastify.register(cors, {
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  await fastify.register(jwt, {
    secret: config.jwtSecret,
  })

  await fastify.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  })

  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  })

  await fastify.register(authRoutes)
  await fastify.register(philosopherRoutes)

  fastify.get('/api/health', async () => ({ status: 'ok' }))

  const shutdown = async () => {
    await fastify.close()
    await pool.end()
    process.exit(0)
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)

  await fastify.listen({ port: config.port, host: config.host })
  console.log(`API server running at ${config.publicApiUrl}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
