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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState({ username: '', password: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('http://localhost:3000/usersDetails');
        setUsers(response.data);
      } catch (error) {
        console.error('There was an error fetching the users:', error);
      }
    };
    if (isLoggedIn) {
      fetchUsers();
    }
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: Integrate with backend authentication
    // This should validate against secure backend endpoint
    // DO NOT hardcode credentials in frontend
    console.warn('Admin login needs backend integration');
    alert('Admin authentication requires backend setup');
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLogin({ ...login, [name]: value });
  };

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
      setUsers(users.filter(user => user._id !== id));
    } catch (error) {
      console.error('There was an error deleting the user:', error);
    }
  };

  const handleUserUpdate = async () => {
    try {
      const { _id, ...updatePayload } = selectedUser;
      const response = await axios.put(`http://localhost:3000/usersDetails/${_id}`, updatePayload);
      
      if (response.data.success) {
        // Optionally refresh the user list here
        setUsers(users.map(user => user._id === _id ? { ...user, ...updatePayload } : user));
        handleDialogClose();
      } else {
        console.error('Update failed:', response.data.message);
      }
    } catch (error) {
      console.error('There was an error updating the user:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  if (!isLoggedIn) {
    return (
      <Box sx={{ maxWidth: 300, mx: 'auto', my: 4 }}>
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <TextField
            label="Username"
            margin="normal"
            name="username"
            type="text"
            fullWidth
            variant="outlined"
            value={login.username}
            onChange={handleLoginChange}
          />
          <TextField
            label="Password"
            margin="normal"
            name="password"
            type="password"
            fullWidth
            variant="outlined"
            value={login.password}
            onChange={handleLoginChange}
          />
          <Button 
    type="submit" 
  variant="contained" 
  fullWidth 
  sx={{ 
    mt: 3, 
    bgcolor: 'green', 
    '&:hover': {
      bgcolor: 'darkgreen' // Darken the button when hovering over it
    }
  }}
>
  Login
</Button>
        </form>
      </Box>
    );
  }

  // AdminPage content
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

