// const request = require("supertest");
import request from "supertest";

import app from "../../app.js";

describe("users", () => {
  it("Returns data ", async () => {
    const res = await request(app)
      .post("/users")
      .send({
        firstName: "Ajinkya",
        lastName: "bhamre",
        username: "ajju",
        email: "ajju@gmail.com",
        password: "ajju123",
      })
      .set("Accept", "application/json") // Set Accept header to indicate JSON response expected
      .expect("Content-Type", /json/); // Expect the response to have JSON content type

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toEqual(true);
  });

  it("Returns data ", async () => {
    const res = await request(app)
      .post("/users")
      .send({
        firstName: "shoaib",
        lastName: "kalawant",
        username: "shobs",
        email: "shobs@gmail.com",
        password: "shob123",
      })
      .set("Accept", "application/json") // Set Accept header to indicate JSON response expected
      .expect("Content-Type", /json/); // Expect the response to have JSON content type

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toEqual(true);
  });





  it("returns bad request if first name is missing", async () => {
    const res = await request(app).post("/users").send({});

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toEqual(false);
  });

  it("returns bad request if first name is missing", async () => {
    const res = await request(app).post("/users").send({
      firstName: "Jan",
      lastName: "Mocha",
      username: "gautam",
    
    });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toEqual(false);
  });

  it("returns bad request if first name is missing", async () => {
    const res = await request(app)
      .post("/users")
      .send({ firstName: "someName" });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toEqual(false);
  });
});
