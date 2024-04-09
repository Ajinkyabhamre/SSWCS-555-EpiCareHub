import { Router } from "express";
import { userDataFetch } from "../data/index.js";
import {
    checkIsProperString,
    validateId,
    checkIsAlphanumeric,
    validateEmail,
} from "../data/helper.js";


const router = Router();

router.route("/")
    .get(async (req, res) => {
        try {
            const allUsers = await userDataFetch.fetchAllUsersData();
            res.status(200).json(allUsers);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    })
    .post(async (req, res) => {
        
    })
    .delete(async (req, res) => {
      
    });

router.route("/:id")
    .get(async (req, res) => {
        try {
            const id = req.params.id; 
            const user = await userDataFetch.getUserById(id);
            if (user) {
                res.status(200).json(user);
            } else {
                throw new Error("User not found");
            }
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    })
    .put(async (req, res) => {
        try {
            const id = req.params.id; 
            const updateObject = req.body; 

         
            const updatedUser = await userDataFetch.updateUserInfo(id, updateObject);

            
            if (updatedUser) {
                return res.status(200).json({
                    userUpdated: updatedUser,
                    message: "User updated successfully",
                    success: true,
                });
            } else {
                throw new Error("Update operation did not return an updated document.");
            }
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    })
    .delete(async (req, res) => {
        try {
            const id = req.params.id; // Get ID from route parameter
            const result = await userDataFetch.removeUser(id);
            if (result) {
                res.status(200).json({ message: "User deleted successfully", success: true });
            } else {
                throw new Error("Failed to delete user");
            }
        } catch (error) {
            res.status(400).json({ message: error.message, success: false });
        }
    });

router.route("/get").post(async (req, res) => {
  
});

export default router;

