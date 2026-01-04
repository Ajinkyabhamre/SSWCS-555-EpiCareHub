// const request = require("supertest");
import request from "supertest";

import app from "../../app.js";
import { dbConnection, closeConnection } from "../../config/mongoConnection.js";

describe("users", () => {
  // Test user data that passes all validation rules
  const validUser1 = {
    firstName: "Ajinkya",
    lastName: "Bhamre",
    username: "ajinkyab", // 8 chars, alphabetic only, no numbers
    email: "ajinkyab@example.com",
    password: "TestPass1!", // 10 chars, uppercase, number, special char
  };

  const validUser2 = {
    firstName: "Shoaib",
    lastName: "Kalawant",
    username: "shoaibk", // 7 chars, alphabetic only
    email: "shoaibk@example.com",
    password: "ValidPass2@", // 11 chars, uppercase, number, special char
  };

  // Clean up test users before each test to ensure clean state
  beforeEach(async () => {
    const db = await dbConnection();
    const usersCollection = db.collection("users");
    await usersCollection.deleteMany({
      email: { $in: [validUser1.email, validUser2.email] },
    });
  });

  it("Returns data - successful registration", async () => {
    const res = await request(app)
      .post("/register")
      .send(validUser1)
      .set("Accept", "application/json");

    // Registration endpoint returns 201 on success
    expect(res.statusCode).toEqual(201);
    expect(res.body.isSuccess).toEqual(true);
  });

  it("Returns data - another successful registration", async () => {
    const res = await request(app)
      .post("/register")
      .send(validUser2)
      .set("Accept", "application/json");

    // Registration endpoint returns 201 on success
    expect(res.statusCode).toEqual(201);
    expect(res.body.isSuccess).toEqual(true);
  });

  it("returns error if first name is missing", async () => {
    const res = await request(app).post("/register").send({});

    // When validation fails, API returns 400
    expect(res.statusCode).toEqual(400);
    expect(res.body).toBeDefined();
  });

  it("returns error if email is missing", async () => {
    const res = await request(app).post("/register").send({
      firstName: "Jan",
      lastName: "Mocha",
      username: "gautam",
    });

    // When validation fails (missing email), API returns 400
    expect(res.statusCode).toEqual(400);
    expect(res.body).toBeDefined();
  });

  it("returns error if password is missing", async () => {
    const res = await request(app)
      .post("/register")
      .send({ firstName: "someName" });

    // When validation fails (missing other required fields), API returns 400
    expect(res.statusCode).toEqual(400);
    expect(res.body).toBeDefined();
  });
});

// Cleanup database connection after all tests
afterAll(async () => {
  try {
    await closeConnection();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
});
