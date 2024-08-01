import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
const prisma = new PrismaClient();

export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", async (request, reply) => {
    const transactions = await prisma.transaction.findMany();

    return reply.status(200).send({ total: 200, transactions });
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

    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: type === "credit" ? amount : amount * -1,
      },
    });

    return reply.status(201).send();
  });
}
