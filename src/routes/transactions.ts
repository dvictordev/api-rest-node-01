import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";
import { z } from "zod";
const prisma = new PrismaClient();

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const sessionId = request.cookies.sessionId;

    if (!sessionId) {
      return reply.status(401).send({
        error: "Unauthorized",
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        session_id: sessionId,
      },
    });

    return reply.status(200).send({ transactions });
  });

  app.get("/:id", async (request, reply) => {
    const getTransactionParamSchema = z.object({
      id: z.string(),
    });

    const { id } = getTransactionParamSchema.parse(request.params);

    const transaction = await prisma.transaction.findUnique({
      where: {
        id: Number(id),
      },
    });

    return reply.status(200).send({ transaction });
  });

  app.get("/summary", async (request, reply) => {
    const transaction = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
    });

    return reply.status(200).send({ summary: transaction._sum });
  });

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
