import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  const handleDialogOpen = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
  };

  const handleUserDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/usersDetails/${id}`);
      setUsers(users.filter((user) => user._id !== id));
    } catch (error) {
      console.error('There was an error deleting the user:', error);
    }
  };

  const handleUserUpdate = async () => {
    try {
      console.log('Attempting to update user with data:', selectedUser);
      const response = await axios.put(`http://localhost:3000/usersDetails/${selectedUser._id}`, selectedUser);
      console.log('Update response:', response.data);

      if (response.data) {
        setUsers(users.map(user => user._id === selectedUser._id ? { ...user, ...selectedUser } : user));
        setOpenDialog(false);
      }
    } catch (error) {
      console.error('There was an error updating the user:', error);
    }
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

      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="firstName"
            label="First Name"
            type="text"
            fullWidth
            variant="standard"
            value={selectedUser.firstName}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="lastName"
            label="Last Name"
            type="text"
            fullWidth
            variant="standard"
            value={selectedUser.lastName}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            variant="standard"
            value={selectedUser.email}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            name="username"
            label="Username"
            type="text"
            fullWidth
            variant="standard"
            value={selectedUser.username}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button onClick={handleUserUpdate}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;
