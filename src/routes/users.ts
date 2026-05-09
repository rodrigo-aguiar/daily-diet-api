import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database';

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    if (!request.body) {
      return reply.status(400).send({
        error: {
          message: 'Request body is missing'
        },
      });
    }

    const createUserSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    try {
      const { name, email } = createUserSchema.parse(request.body);

      const userByEmail = await knex('users').where({ email }).first()

      if (userByEmail) {
        return reply.status(400).send({
          error: {
            message: 'User already exists'
          }
        });
      }

      let sessionId = request.cookies.sessionId

      if (!sessionId) {
        sessionId = randomUUID()

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      } else {
        return reply.status(401).send({ error: 'User already has a session' })
      }

      const newUser = {
        id: randomUUID(),
        name,
        email,
      };

      const databaseResult = await knex('users').insert({ ...newUser, session_id: sessionId});

      console.log('Database result:', databaseResult);

      return reply.status(201).send(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            message: 'Invalid request body',
            details: error.errors,
          }
        });
      }

      return reply.status(500).send({
        error: {
          message: 'Internal server error',
          details: error,
        }
      });
    }
  })
}