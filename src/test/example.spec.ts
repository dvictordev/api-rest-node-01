import { test, beforeAll, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app";

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it("should be able to create a new transaction", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);

    const cookies: any = response.get("Set-Cookie");

    const listTransactionReponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    console.log(listTransactionReponse.body.transactions);

    expect(listTransactionReponse.body.transactions).toEqual([
      {
        id: expect.any(Number),
        title: expect.any(String),
        amount: expect.any(String),
        created_at: expect.any(String),
        session_id: expect.any(String),
      },
    ]);
  });

  it("should be able to get a specific transaction", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);

    const cookies: any = response.get("Set-Cookie");

    const listTransactionReponse = await request(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = listTransactionReponse.body.transactions[0].id;

    const getSpecificTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getSpecificTransaction.body.transaction).toEqual({
      id: expect.any(Number),
      title: expect.any(String),
      amount: expect.any(String),
      created_at: expect.any(String),
      session_id: expect.any(String),
    });
  });

  it("should be able to get a sumary", async () => {
    const response = await request(app.server)
      .post("/transactions")
      .send({
        title: "new transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);

    const cookies: any = response.get("Set-Cookie");

    await request(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "new transaction",
        amount: 2000,
        type: "debit",
      })
      .expect(201);

    const summaryResponse = await request(app.server)
      .get(`/transactions/summary`)
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryResponse.body.summary).toEqual({
      amount: "3000",
    });
  });
});
