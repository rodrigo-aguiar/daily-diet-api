import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database';
import { checkSessionId } from '../middlewares/check-session-id';

export async function mealsRoutes(app: FastifyInstance) {
  app.post('/', { preHandler: [checkSessionId] }, async (request, reply) => {
    if (!request.body) {
      return reply.status(400).send({
        error: {
          message: 'Request body is missing'
        },
      });
    }

    const createMealSchema = z.object({
      name: z.string(),
      description: z.string(),
      isOnDiet: z.boolean(),
      date: z.coerce.date(),
    });

    try {
      const { name, description, isOnDiet, date } = createMealSchema.parse(request.body);

      const newMeal = {
        id: randomUUID(),
        name,
        description,
        isOnDiet,
        date,
        userId: request.user?.id,
      };

      await knex('meals').insert({
        id: newMeal.id,
        name: newMeal.name,
        description: newMeal.description,
        is_on_diet: newMeal.isOnDiet,
        date: newMeal.date,
        user_id: newMeal.userId,
      });

      return reply.status(201).send(newMeal);
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