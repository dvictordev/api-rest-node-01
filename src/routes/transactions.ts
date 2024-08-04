import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { checkSessionIdExist } from "../middlewares/check_session_id_exist";
const prisma = new PrismaClient();

export async function transactionsRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: [checkSessionIdExist],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const transactions = await prisma.transaction.findMany({
        where: {
          session_id: sessionId,
        },
      });

      return reply.status(200).send({ transactions });
    }
  );

  app.get(
    "/:id",
    {
      preHandler: [checkSessionIdExist],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const getTransactionParamSchema = z.object({
        id: z.string(),
      });

      const id = Number(getTransactionParamSchema.parse(request.params).id);

      const transaction = await prisma.transaction.findUnique({
        where: {
          id,
          session_id: sessionId,
        },
      });

      return reply.status(200).send({ transaction });
    }
  );

  app.get(
    "/summary",
    {
      preHandler: [checkSessionIdExist],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies;

      const transaction = await prisma.transaction.aggregate({
        _sum: {
          amount: true,
        },
        where: {
          session_id: sessionId,
        },
      });

      return reply.status(200).send({ summary: transaction._sum });
    }
  );

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, //7 days
      });
    }
    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: type === "credit" ? amount : amount * -1,
        session_id: sessionId,
      },
    });

    return reply.status(201).send(transaction);
  });
}
