/**
 * EpiCareHub Database Seed Script
 *
 * This script populates MongoDB Atlas with realistic fake data for development and testing.
 * It creates:
 * - 1 Admin user + 2 Normal users
 * - 5-8 Patients with realistic profiles
 * - 1-3 EEG Studies per patient
 *
 * Usage: npm run seed
 *
 * WARNING: This script DELETES ALL EXISTING DATA before seeding!
 * Only use in development/test environments.
 */

import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import { users, patients, eegStudies as eegStudiesCollection } from "../config/mongoCollections.js";
import { userData, patientsData, eegStudiesData } from "../data/index.js";
import bcrypt from "bcrypt";
import moment from "moment";
import { randomUUID } from "crypto";

const SALT_ROUNDS = 14;

// Fake data generators
const FIRST_NAMES = {
  male: ["James", "Michael", "Robert", "David", "William", "Richard", "Joseph", "Thomas"],
  female: ["Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Barbara", "Susan", "Jessica"]
};

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson"
];

const CLINICIAN_USERNAMES = ["drsmith", "clinician1", "neurologist2"];
const ADMIN_USERNAME = "admin";

/**
 * Generate random date in MM/DD/YYYY format
 */
function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1);
  const end = new Date(endYear, 11, 31);
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return moment(date).format("MM/DD/YYYY");
}

/**
 * Generate random EEG summary
 */
function randomSummary() {
  const regions = [
    "Left temporal lobe",
    "Right temporal lobe",
    "Left frontal lobe",
    "Right frontal lobe",
    "Left parietal lobe",
    "Right parietal lobe",
    "Occipital lobe"
  ];
  const confidence = Math.floor(Math.random() * 20) + 70; // 70-90%
  const region = regions[Math.floor(Math.random() * regions.length)];
  return `Highest activity detected in ${region}, ${confidence}% confidence`;
}

/**
 * Generate placeholder brain view URLs
 */
function generateBrainViews() {
  const views = [
    "Medial View", "Rostral View", "Caudal View", "Dorsal View", "Ventral View",
    "Frontal View", "Parietal View", "Temporal View", "Occipital View",
    "Lateral Left View", "Lateral Right View"
  ];

  return views.map((view, index) => {
    const color = `0${(5 + index).toString(16)}966${(9 - Math.floor(index / 2)).toString(16)}`;
    return `https://placehold.co/1000x400/${color}/white?text=${encodeURIComponent(view)}`;
  });
}

/**
 * Generate placeholder topomap URL
 */
function generateTopomapUrl() {
  return "https://placehold.co/600x400/0f766e/white?text=EEG+Topomap";
}

/**
 * Clear all existing data
 */
async function clearDatabase() {
  console.log("\n🗑️  Clearing existing data...");

  const usersCollection = await users();
  const patientsCollection = await patients();
  const studiesCollection = await eegStudiesCollection();

  const usersDeleted = await usersCollection.deleteMany({});
  const patientsDeleted = await patientsCollection.deleteMany({});
  const studiesDeleted = await studiesCollection.deleteMany({});

  console.log(`   ✓ Deleted ${usersDeleted.deletedCount} users`);
  console.log(`   ✓ Deleted ${patientsDeleted.deletedCount} patients`);
  console.log(`   ✓ Deleted ${studiesDeleted.deletedCount} studies`);
}

/**
 * Seed users: 1 admin + 2 clinicians
 */
async function seedUsers() {
  console.log("\n👥 Seeding users...");
  const createdUsers = [];

  // Create admin user
  try {
    const adminPassword = await bcrypt.hash("Admin123!", SALT_ROUNDS);
    const usersCollection = await users();
    const adminUser = {
      firstName: "Admin",
      lastName: "User",
      username: ADMIN_USERNAME,
      email: "admin@epicarehub.com",
      password: adminPassword,
      userType: "admin"
    };

    const adminResult = await usersCollection.insertOne(adminUser);
    createdUsers.push({ ...adminUser, _id: adminResult.insertedId });
    console.log(`   ✓ Created admin: ${adminResult.insertedId} (${ADMIN_USERNAME})`);
  } catch (error) {
    console.error(`   ✗ Failed to create admin: ${error.message}`);
  }

  // Create 2 clinician users
  const clinicianData = [
    {
      firstName: "John",
      lastName: "Smith",
      username: "drsmith",
      email: "john.smith@epicarehub.com",
      password: "Clinician123!"
    },
    {
      firstName: "Sarah",
      lastName: "Johnson",
      username: "drsarah",
      email: "sarah.johnson@epicarehub.com",
      password: "Clinician123!"
    }
  ];

  for (const clinician of clinicianData) {
    try {
      const hashedPassword = await bcrypt.hash(clinician.password, SALT_ROUNDS);
      const usersCollection = await users();
      const clinicianUser = {
        firstName: clinician.firstName,
        lastName: clinician.lastName,
        username: clinician.username,
        email: clinician.email,
        password: hashedPassword,
        userType: "user"
      };

      const result = await usersCollection.insertOne(clinicianUser);
      createdUsers.push({ ...clinicianUser, _id: result.insertedId });
      console.log(`   ✓ Created user: ${result.insertedId} (${clinician.username})`);
    } catch (error) {
      console.error(`   ✗ Failed to create user ${clinician.username}: ${error.message}`);
    }
  }

  return createdUsers;
}

/**
 * Seed patients: 5-8 realistic patients
 */
async function seedPatients() {
  console.log("\n🏥 Seeding patients...");
  const createdPatients = [];
  const numPatients = 5 + Math.floor(Math.random() * 4); // 5-8 patients

  for (let i = 0; i < numPatients; i++) {
    const gender = Math.random() > 0.5 ? 1 : 0; // 0 = Male, 1 = Female
    const genderKey = gender === 0 ? "male" : "female";
    const firstNames = FIRST_NAMES[genderKey];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const dob = randomDate(1950, 2010);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    try {
      const patient = await patientsData.addPaitent(
        firstName,
        lastName,
        dob,
        gender,
        email
      );

      // Add epilepsy status and comments randomly
      const isEpilepsy = Math.random() > 0.5;
      const comments = isEpilepsy
        ? "Patient diagnosed with focal epilepsy. Regular monitoring required."
        : "No epilepsy diagnosis. Routine EEG screening.";

      // Update patient with additional fields
      const patientsCollection = await patients();
      await patientsCollection.updateOne(
        { _id: patient._id },
        {
          $set: {
            isEpilepsy,
            comments
          }
        }
      );

      createdPatients.push({ ...patient, isEpilepsy, comments });
      console.log(`   ✓ Created patient: ${patient._id} (${firstName} ${lastName}, ${isEpilepsy ? "Epilepsy" : "No Epilepsy"})`);
    } catch (error) {
      console.error(`   ✗ Failed to create patient: ${error.message}`);
    }
  }

  return createdPatients;
}

/**
 * Seed EEG studies: 1-3 studies per patient
 */
async function seedStudies(patients) {
  console.log("\n📊 Seeding EEG studies...");
  const createdStudies = [];

  for (const patient of patients) {
    const numStudies = 1 + Math.floor(Math.random() * 3); // 1-3 studies per patient

    for (let i = 0; i < numStudies; i++) {
      const uploadId = `seed-${randomUUID()}`;
      const uploadDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Within last 90 days
      const completionDate = new Date(uploadDate.getTime() + Math.random() * 3600000); // Up to 1 hour later

      const studyData = {
        patientId: patient._id.toString(),
        uploadId,
        status: "COMPLETED",
        title: i === 0 ? "Baseline EEG" : `Follow-up Study ${i}`,
        uploadDate,
        completionDate,
        summary: randomSummary(),
        hotspots: [
          {
            region: "Temporal Lobe",
            confidence: Math.floor(Math.random() * 30) + 60,
            hemisphere: Math.random() > 0.5 ? "Left" : "Right"
          }
        ],
        figureUrls: {
          topomap: generateTopomapUrl(),
          brainViews: generateBrainViews(),
          annotated: []
        },
        reportUrl: null,
        errorMessage: null,
        processingTime: Math.floor(Math.random() * 300) + 60, // 60-360 seconds
        metadata: {
          modelVersion: "ConvDip-1.0",
          mneVersion: "1.5.0"
        }
      };

      try {
        const study = await eegStudiesData.createStudy(studyData);
        createdStudies.push(study);
        console.log(`   ✓ Created study: ${study._id} (patient: ${patient._id}, ${studyData.title})`);
      } catch (error) {
        console.error(`   ✗ Failed to create study for patient ${patient._id}: ${error.message}`);
      }
    }
  }

  return createdStudies;
}

/**
 * Main seed function
 */
async function seed() {
  console.log("🌱 Starting EpiCareHub database seed...");
  console.log("━".repeat(60));

  try {
    // Connect to database
    await dbConnection();

    // Clear existing data
    await clearDatabase();

    // Seed data
    const users = await seedUsers();
    const patients = await seedPatients();
    const studies = await seedStudies(patients);

    // Summary
    console.log("\n" + "━".repeat(60));
    console.log("✅ Seed completed successfully!");
    console.log(`   Total users created: ${users.length}`);
    console.log(`   Total patients created: ${patients.length}`);
    console.log(`   Total studies created: ${studies.length}`);
    console.log("━".repeat(60));

    // Login credentials
    console.log("\n🔐 Login Credentials:");
    console.log("   Admin:");
    console.log(`     Username: admin`);
    console.log(`     Password: Admin123!`);
    console.log("\n   Clinicians:");
    console.log(`     Username: drsmith`);
    console.log(`     Password: Clinician123!`);
    console.log(`     Username: drsarah`);
    console.log(`     Password: Clinician123!`);
    console.log("━".repeat(60));

  } catch (error) {
    console.error("\n❌ Seed failed:");
    console.error(`   ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connection
    await closeConnection();
    console.log("\n🔌 Database connection closed.");
    process.exit(0);
  }
}

// Run seed
seed();
