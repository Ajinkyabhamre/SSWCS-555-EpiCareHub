import { users } from "../config/mongoCollections.js";

async function fetchUsersData() {
  try {
    // Obtain the users collection reference
    const usersCollection = await users();

    // Fetch data from the collection
    const userData = await usersCollection
      .find(
        {},
        { projection: { firstName: 1, lastName: 1, username: 1, email: 1 } }
      )
      .toArray();
    //return userData; // Return the fetched user data
    // console.log("Data fetched successfully:", userData);
  } catch (error) {
    console.error("Error occurred while fetching data:", error);
  }
}

// To check the working of the fetchData function
//fetchUsersData();
export default fetchUsersData();
