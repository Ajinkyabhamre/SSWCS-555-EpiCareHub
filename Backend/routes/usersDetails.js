// Import necessary modules
import { Router } from "express";
import { userDataFetch } from "../data/index.js";
import {
    checkIsProperString,
    validateId,
    checkIsAlphanumeric,
    validateEmail,
  } from "../data/helper.js";

// Create an instance of Express Router
const router = Router();

router
  .route("/")
  .get(async (req, res) => {
    try {
      const allUsers = await userDataFetch.fetchAllUsersData();
      res.status(200).json(allUsers);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  })
  .delete(async (req, res) => {
    try {
      const deletedUser = await userDataFetch.removeUser(req.params.id);
      res.status(200).json(deletedUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
  .put(async (req, res) => {
    try {
      req.body.id = validateId(req.body.id, "patient id");
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.username = checkIsAlphanumeric(req.body.username, "username");
      req.body.email = validateEmail(req.body.email);
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(400).json(result);
    }

    try {
      const updateUser = await userDataFetch.updateUserInfo(
        req.body.id,
        req.body
      );

      const result = {
        userAdded: updateUser,
        message: "User updated succesfully",
        success: true,
      };
      return res.json(result);
    } catch (error) {
      const result = {
        userAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/usersDetails");
  });

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "user id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deleteUser = await userDataFetch.getUserById(req.params.id);
      return res.status(200).json(deleteUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
  .put(async (req, res) => {})
  .delete(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "user id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deleteUser = await userDataFetch.removeUser(req.params.id);
      return res.status(200).json(deleteUser);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

router.route("/get").post(async (req, res) => {
  try {
    if (req.body.firstName !== undefined)
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
    if (req.body.lastName !== undefined)
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
    if (req.body.username !== undefined) {
      req.body.username = checkIsAlphanumeric(req.body.username, "username");
    }

    if (req.body.email !== undefined)
      req.body.email = validateEmail(req.body.email, "email");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

  try {
    const UserData = await userDataFetch.fetchAllUsersData(req.body);
    return res.json(UserData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

/*

// Define route for fetching all user details
router.get("/", async (req, res) => {
    try {
        // Fetch all user details from the database
        const allUsers = await userDataFetch.fetchUsersData();

        // Send the fetched user details as a JSON response
        res.status(200).json(allUsers);
    } catch (error) {
        // If an error occurs, send an error response
        res.status(500).json({ error: error.message });
    }
});

// Export the router
export default router;
*/
