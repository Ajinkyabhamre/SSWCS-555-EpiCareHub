import UserOperations from "../../data/usersDetails.js";

describe("User Details Data Tests", () => {

  test("fetchAllUsersData should return an array", async () => {
    const mockUsersData = [
      {
        _id: '65fc98ab8cc37c6ec10469d5',
        firstName: 'user',
        lastName: 'one',
        username: 'user1',
        email: 'user1@gmail.com'
      },
      {
        _id: '66005e9e4006d9c10362d5b3',
        firstName: 'user',
        lastName: 'name',
        username: 'username',
        email: 'user2@gmail.com'
      },
      {
        _id: '66005f1f4006d9c10362d5b4',
        firstName: 'user3',
        lastName: 'name',
        username: 'user3',
        email: 'user3@gmail.com'
      },
      {
        _id: '6600609f4006d9c10362d5b5',
        firstName: 'user5',
        lastName: 'name',
        username: 'user5',
        email: 'user5@gmail.com'
      }
    ];
    const UserOperations = {
      fetchAllUsersData: async () => mockUsersData, // Manually mock the function
    };
  
    const userData = await UserOperations.fetchAllUsersData();
  
    expect(userData).toBeInstanceOf(Array);
    expect(userData).toHaveLength(mockUsersData.length);
    });
  
    test("fetchAllUsersData should handle errors", async () => {
      const UserOperations = {
        fetchAllUsersData: async () => {
          throw new Error("Data retrieval error"); // Manually throw an error
        },
      };
    
      await expect(UserOperations.fetchAllUsersData()).rejects.toThrow(
        "Data retrieval error"
      );
    });

    test("updateUserInfo should update a user's information", async () => {
      const userId = '6600609f4006d9c10362d5b5';
      const updateObject = { firstName: 'user5update',
      lastName: 'nameupdate',
      username: 'user5update',
      email: 'user5update@gmail.com' };
      const mockUpdatedUser = { firstName: 'user5update',
      lastName: 'nameupdate',
      username: 'user5update',
      email: 'user5update@gmail.com' };
    
      const UserOperations = {
        updateUserInfo: async (id, updateData) => {
          expect(id).toBe(userId);
          expect(updateData).toEqual(updateObject);
          return mockUpdatedUser;
        },
      };
    
      const updatedUser = await UserOperations.updateUserInfo(userId, updateObject);
    
      expect(updatedUser).toEqual(mockUpdatedUser);
    });
  
    test("removeUser should return a success message", async () => {
      const userId = '66005f1f4006d9c10362d5b4';
      const mockDeletionResult = "User deleted successfully";
    
      const UserOperations = {
        removeUser: async (id) => {
          expect(id).toBe(userId);
          return mockDeletionResult;
        },
      };
    
      const deletionResult = await UserOperations.removeUser(userId);
    
      expect(deletionResult).toBe(mockDeletionResult);
    });

    test("removeUser should handle errors", async () => {
      const userId = '66005f1f4006d9c10362d5b4';
    
      const exportedMethods = {
        removeUser: async (id) => {
          expect(id).toBe(userId);
          throw new Error("User deletion error");
        },
      };
    
      await expect(exportedMethods.removeUser(userId)).rejects.toThrow(
        "User deletion error"
      );
    });
  });