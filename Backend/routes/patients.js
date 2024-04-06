import { Router } from "express";
const router = Router();
import { patientsData } from "../data/index.js";
import {
  checkIsProperString,
  isDateValid,
  validateId,
  validateEmail,
  checkIsProperNumber,
} from "../data/helper.js"
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Store uploaded files in the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name
  },
});

const upload = multer({ storage: storage });

router
  .route("/")
  .get(async (req, res) => {
    return res.send("GET request to http://localhost:3000/paitents");
  })
  .post(async (req, res) => {
    try {
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
      checkIsProperNumber(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }

    try {
      const addPaitent = await patientsData.addPaitent(
        req.body.firstName,
        req.body.lastName,
        req.body.dob,
        req.body.gender,
        req.body.email
      );

      const result = {
        patientAdded: addPaitent,
        message: "Patient added succesfully",
        success: true,
      };
      return res.json(result);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .delete(async (req, res) => {
    return res.send("DELETE request to http://localhost:3000/paitents");
  })
  .put(async (req, res) => {
    try {
      req.body.id = validateId(req.body.id, "patient id");
      req.body.firstName = checkIsProperString(req.body.firstName, "firstName");
      req.body.lastName = checkIsProperString(req.body.lastName, "lastName");
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
      checkIsProperNumber(req.body.gender, "gender");
      req.body.email = validateEmail(req.body.email);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(400).json(result);
    }

    try {
      const updatePatient = await patientsData.updatePatientInfo(
        req.body.id,
        req.body
      );

      const result = {
        patientAdded: updatePatient,
        message: "Patient updated succesfully",
        success: true,
      };
      return res.json(result);
    } catch (error) {
      const result = {
        patientAdded: null,
        message: error.message,
        success: false,
      };
      return res.status(404).json(result);
    }
  })
  .patch(async (req, res) => {
    return res.send("PATCH request to http://localhost:3000/paitents");
  });

router
  .route("/:id")
  .get(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "patient id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deletePaitent = await patientsData.getPaitentById(req.params.id);
      return res.status(200).json(deletePaitent);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  })
  .put(async (req, res) => {})
  .delete(async (req, res) => {
    try {
      req.params.id = validateId(req.params.id, "patient id");
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
    try {
      const deletePaitent = await patientsData.removePatient(req.params.id);
      return res.status(200).json(deletePaitent);
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
    if (req.body.dob !== undefined) {
      req.body.dob = checkIsProperString(req.body.dob, "date of birth");
      req.body.dob = isDateValid(req.body.dob, "date of birth");
    }

    if (req.body.email !== undefined)
      req.body.email = validateEmail(req.body.email, "email");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }

  try {
    const PatientsData = await patientsData.getAllPaitents(req.body);
    return res.json(PatientsData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.route("/upload").post(async (req, res) => {
 const patientId = req.body.patientId; // Get the patient ID from the request body

 // Check if the patient ID is valid
//  if (!validPatientIds.includes(patientId)) {
//    return res.status(400).send("Invalid patient ID.");
//  }

 // If the patient ID is valid, use Multer to handle file upload
 upload.single("file")(req, res, (err) => {
   if (err) {
     console.error("Error uploading file:", err);
     return res.status(500).send("Error uploading file.");
   }

   const file = req.file;
   if (!file) {
     return res.status(400).send("No file uploaded.");
   }

   // Process the uploaded file as needed
   console.log("File uploaded:", file.originalname);

   res.send("File uploaded successfully.");
 });
});
export default router;
