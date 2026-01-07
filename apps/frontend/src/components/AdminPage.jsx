import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { motion } from 'framer-motion';
import { apiClient } from '../utils/api';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [login, setLogin] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        // Using apiClient ensures withCredentials: true for session cookies
        const response = await apiClient.get('/usersDetails');
        setUsers(response.data);
      } catch (error) {
        console.error('There was an error fetching the users:', error);
        setError('Failed to load users');
      } finally {
        setLoading(false);
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
    setError('Admin authentication requires backend setup. Please contact your administrator.');
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
    setSelectedUser({});
  };

  const handleUserDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Using apiClient ensures withCredentials: true for session cookies
      await apiClient.delete(`/usersDetails/${id}`);
      setUsers(users.filter(user => user._id !== id));
    } catch (error) {
      console.error('There was an error deleting the user:', error);
      setError('Failed to delete user');
    }
  };

  const handleUserUpdate = async () => {
    try {
      const { _id, ...updatePayload } = selectedUser;
      // Using apiClient ensures withCredentials: true for session cookies
      const response = await apiClient.put(`/usersDetails/${_id}`, updatePayload);

      if (response.data.success) {
        setUsers(users.map(user => user._id === _id ? { ...user, ...updatePayload } : user));
        handleDialogClose();
      } else {
        console.error('Update failed:', response.data.message);
        setError('Failed to update user');
      }
    } catch (error) {
      console.error('There was an error updating the user:', error);
      setError('Failed to update user');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedUser({ ...selectedUser, [name]: value });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
        <div className="flex items-center justify-center px-4 py-12 md:py-20">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-[0_18px_60px_rgba(15,118,110,0.10)]"
            >
              <div className="mb-8 text-center">
                <div className="mb-4 text-5xl">🔐</div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Admin Login
                </h1>
                <p className="text-slate-600">
                  Enter your credentials to access the admin panel
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Username
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={login.username}
                    onChange={handleLoginChange}
                    placeholder="Enter admin username"
                    className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={login.password}
                    onChange={handleLoginChange}
                    placeholder="Enter admin password"
                    className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 shadow-md shadow-emerald-600/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  Login
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6 pt-10 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-slate-600">
            Manage user accounts and permissions
          </p>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-rose-200 bg-rose-50 p-4 mb-6"
          >
            <p className="text-rose-700 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl border border-emerald-50 bg-white p-6 shadow-sm mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Total Users
              </p>
              <p className="text-3xl font-bold text-emerald-600">
                {users.length}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">
              👥
            </div>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-3xl border border-emerald-50 bg-white p-6 shadow-[0_18px_60px_rgba(15,118,110,0.10)]"
        >
          <div className="mb-6 pb-4 border-b border-emerald-50">
            <h2 className="text-xl font-semibold text-slate-900">
              User Accounts
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">👤</div>
              <p className="text-slate-600 mb-2">No users found</p>
              <p className="text-sm text-slate-500">
                User accounts will appear here once created
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-emerald-50">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="border-b border-emerald-50 hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <span className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {user.email}
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        {user.username}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleDialogOpen(user)}
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 text-sm transition-all duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleUserDelete(user._id)}
                            className="rounded-full border-2 border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold px-4 py-2 text-sm transition-all duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit User Dialog */}
      <Dialog
        header="Edit User"
        visible={openDialog}
        onHide={handleDialogClose}
        className="w-full md:w-2/3 lg:w-1/2"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={selectedUser.firstName || ''}
              onChange={handleChange}
              placeholder="Enter first name"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={selectedUser.lastName || ''}
              onChange={handleChange}
              placeholder="Enter last name"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={selectedUser.email || ''}
              onChange={handleChange}
              placeholder="Enter email"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={selectedUser.username || ''}
              onChange={handleChange}
              placeholder="Enter username"
              className="w-full rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDialogClose}
              className="flex-1 rounded-full border-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 font-semibold px-6 py-3 transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUserUpdate}
              className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 shadow-md shadow-emerald-600/40 transition-all duration-200"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default AdminPage;
