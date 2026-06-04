import { FastifyInstance } from 'fastify'
import type { LoginInput, AuthResponse } from '@philosophy/shared'
import { findUserByUsername, verifyPassword, findUserById } from '../db/users'
import { requireAuth } from '../middleware/auth'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginInput }>('/api/auth/login', async (request, reply) => {
    try {
      const { username, password } = request.body || {}

      if (!username || !password) {
        return reply.status(400).send({ error: 'username and password are required' })
      }

      const user = await findUserByUsername(username)
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return reply.status(401).send({ error: 'Invalid username or password' })
      }

      const token = fastify.jwt.sign(
        { sub: user.id, username: user.username },
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
      )

      const response: AuthResponse = {
        token,
        user: { id: user.id, username: user.username },
      }
      return response
    } catch (err) {
      fastify.log.error(err)
      return reply.status(500).send({
        error: err instanceof Error ? err.message : 'Internal Server Error',
      })
    }
  })

  fastify.get('/api/auth/me', { preHandler: requireAuth }, async (request, reply) => {
    const payload = request.user as { sub: number; username: string }
    const user = await findUserById(payload.sub)
    if (!user) {
      return reply.status(401).send({ error: 'User not found' })
    }
    return user
  })
}
