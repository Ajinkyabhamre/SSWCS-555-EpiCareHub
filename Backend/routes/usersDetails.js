// Import necessary modules
import { Router } from "express";
import { userDataFetch } from "../data/index.js";

// Create an instance of Express Router
const router = Router();

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
