import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database';

export async function usersRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    if (!request.body) {
      reply.status(201).send({
        result: {
          error: {
            message: 'Request body is missing'
          },
        }
      });
    }

    const createUserSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    try {
      const { name, email } = createUserSchema.parse(request.body);

      let sessionId = request.cookies.sessionId

      if (!sessionId) {
        sessionId = randomUUID()

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      }

      const user = {
        id: randomUUID(),
        name,
        email
      };

      await knex('users').insert(user);

      reply.status(201).send({ result: { user } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        reply.status(400).send({
          result: {
            error: {
              message: 'Invalid request body',
              details: error.errors,
            },
          }
        });
      }
    }
  })
}