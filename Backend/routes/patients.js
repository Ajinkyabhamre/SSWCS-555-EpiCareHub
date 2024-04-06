import { Router } from "express";
const router = Router();
import { patientsData } from "../data/index.js";
import {
  checkIsProperString,
  isDateValid,
  validateId,
  validateEmail,
  checkIsProperNumber,
} from "../data/helper.js";
import multer from "multer";
import { ObjectId } from "mongodb";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "Uploads"); // Set destination folder
  },
  filename: function (req, file, cb) {
    cb(null, path.extname(file.originalname)); // Set file name
  },
});

// Initialize multer upload
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("file");

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
  let patientId = req.body.patientId; // Get the patient ID from the request body
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({ error: "No Files were passed" });
  }

  patientId = validateId(patientId, "patient Id");

  // TODO:
  // 1. check patient Id
  // 2. push new objectId.toString() into array
  // 3.

  const myNewId = new ObjectId();
  upload(req, res, (err) => {
    console.log(req);
    if (err) {
      res.status(400).json({ error: err });
    } else {
      // File uploaded successfully
      // Now you can store the file location in the database or perform other operations
      const fileLocation = path.join("Uploads", myNewId.toString(), "eegData");
      // If 'Uploads/newObjectId' directory doesn't exist, create it
      const dir = path.join("Uploads", myNewId.toString());
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      // Move the file to the specified location
      fs.renameSync(req.file.path, fileLocation);
      res.json({ fileLocation: fileLocation });
    }
  });

  return res.json(req.files.file.name);
});
export default router;
