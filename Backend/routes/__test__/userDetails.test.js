import exportedMethods from "../../data/usersDetails.js";

describe("User Details Data Tests", () => {
    test("fetchAllUsersData should fetch user data", async () => {
      try {
        const userData = await exportedMethods.fetchAllUsersData();
        expect(userData).toBeDefined(); // Add appropriate assertions
      } catch (error) {
        throw new Error("fetchAllUsersData threw an error: " + error);
      }
    });
  
    /*test("updateUserInfo should update user information", async () => {
      try {
        const userId = '66005e9e4006d9c10362d5b3'; 
        const updateObject = {
          firstName: 'NewFirstName',
          lastName: 'NewLastName',
          username: 'newUsername',
          email: 'newemail@example.com'
        };
        const updatedUser = await exportedMethods.updateUserInfo(userId, updateObject);
        expect(updatedUser).toBeDefined(); // Add appropriate assertions
      } catch (error) {
        throw new Error("updateUserInfo threw an error: " + error);
      }
    });
  
    test("removeUser should delete a user", async () => {
      try {
        const userId = '65fc98ab8cc37c6ec10469d5'; 
        const deletionResult = await exportedMethods.removeUser(userId);
        expect(deletionResult).toBeDefined(); // Add appropriate assertions
      } catch (error) {
        throw new Error("removeUser threw an error: " + error);
      }
    });*/

    // Mock the database methods
  const mockFindOneAndDelete = jest.fn();
  const mockFindOneAndUpdate = jest.fn();

  test('removeUser should delete a user', async () => {
    // Mock the deletion result
    const deletionResult = { _id: 'userId', deleted: true };

    // Mock the database collection
    const usersCollection = {
      findOneAndDelete: mockFindOneAndDelete.mockResolvedValue(deletionResult),
    };

    // Call the removeUser function
    const result = await removeUser('userId', usersCollection);

    // Check if the user was deleted
    expect(result).toEqual(deletionResult);
    expect(mockFindOneAndDelete).toHaveBeenCalledWith({ _id: 'userId' });
  });

  test('updateUser should update user information', async () => {
    // Mock the update result
    const updatedUser = { _id: 'userId', firstName: 'NewFirstName', lastName: 'NewLastName' };

    // Mock the database collection
    const usersCollection = {
      findOneAndUpdate: mockFindOneAndUpdate.mockResolvedValue(updatedUser),
    };

    // Mock the updateObject
    const updateObject = {
      firstName: 'NewFirstName',
      lastName: 'NewLastName',
    };

    // Call the updateUser function
    const result = await updateUser('userId', updateObject, usersCollection);

    // Check if the user information was updated
    expect(result).toEqual(updatedUser);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'userId' },
      { $set: { firstName: 'NewFirstName', lastName: 'NewLastName' } },
      { returnDocument: 'after' }
    );
  });
  });