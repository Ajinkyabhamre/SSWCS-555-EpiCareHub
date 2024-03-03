import { Router } from "express";
const router = Router();
import { paitentsData } from "../data/index.js";


router
  .route("/")
  .get(async (req, res) => {
    return res.send("GET request to http://localhost:3000/paitents");
  })
  .post(async (req, res) => {
    //console.log(req.body);
    return res.send("POST request to http://localhost:3000/paitents");
  })
  .delete(async (req, res) => {
    return res.send("DELETE request to http://localhost:3000/paitents");
  })
  .put(async (req, res) => {
    return res.send("PUT request to http://localhost:3000/paitents");
  })
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/paitents");
  });

  export default router;
