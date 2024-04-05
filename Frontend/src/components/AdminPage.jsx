/*import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

const AdminPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/usersDetails/`);
        setUser(response.data);
        console.log(response.data)
      } catch (error) {
        console.log(error);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="bg-gray-200 h-full p-4 grid grid-cols-1 lg:grid-cols-2 overflow-hidden w-full mx-auto gap-4">
      {user && (
        <div className="p-4 bg-white shadow-md rounded-lg">
          <h2 className="text-2xl font-bold mb-2 text-gray-800">
            User Details
          </h2>
          <div className="border-b-2 border-gray-300 mb-4"></div>
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">First Name:</span>
              <span className="text-blue-600">{user.firstName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Last Name:</span>
              <span className="text-blue-600">{user.lastName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Email:</span>
              <span className="text-blue-600">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-600">Username:</span>
              <span className="text-blue-600">{user.username}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
*/



import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from "react-router-dom";
import {
  Table, TableHead, TableRow, TableCell, TableBody,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Box
} from '@mui/material';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/usersDetails');
        setUsers(response.data);
      } catch (error) {
        console.error('There was an error fetching the users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleUserDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/usersDetails/${id}`);
      setUsers(users.filter((user) => user._id !== id)); // Optimistically remove the user from UI
    } catch (error) {
      console.error('There was an error deleting the user:', error);
    }
  };

  const handleUserUpdate = async () => {
    try {
      await axios.put(`http://localhost:3000/usersDetails/${selectedUser._id}`, selectedUser);
      setUsers(users.map(user => user._id === selectedUser._id ? selectedUser : user)); // Optimistically update the user in UI
      handleDialogClose();
    } catch (error) {
      console.error('There was an error updating the user:', error);
    }
  };

  const handleDialogOpen = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedUser({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
      <h1>Admin Page</h1>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Username</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <Button onClick={() => handleDialogOpen(user)}>Edit</Button>
                <Button onClick={() => handleUserDelete(user._id)}>Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Dialog and other UI elements */}
    </Box>
  );
};

export default AdminPage;
