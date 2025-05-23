import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';

const Coaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCoach, setCurrentCoach] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hourlyRate: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const res = await axios.get('http://localhost:5000/api/coaches', config);
      setCoaches(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching coaches:', err);
      setError('Failed to load coaches. Please try again.');
      setLoading(false);
    }
  };

  const openEditModal = (coach) => {
    setCurrentCoach(coach);
    setFormData({
      name: coach.name,
      email: coach.email,
      hourlyRate: coach.hourlyRate
    });
    setIsEditModalOpen(true);
    // Clear any previous messages
    setError('');
    setSuccess('');
  };

  const openDeleteModal = (coach) => {
    setCurrentCoach(coach);
    setIsDeleteModalOpen(true);
    // Clear any previous messages
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.name === 'hourlyRate' ? Number(e.target.value) : e.target.value
    });
  };

  const showMessage = (message, isError = false) => {
    if (isError) {
      setError(message);
      setSuccess('');
    } else {
      setSuccess(message);
      setError('');
    }
    
    // Auto-hide message after 3 seconds
    setTimeout(() => {
      setError('');
      setSuccess('');
    }, 3000);
  };

  const handleUpdateCoach = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.put(
        `http://localhost:5000/api/coaches/${currentCoach._id}`,
        formData,
        config
      );
      
      // Update local state without refetching
      setCoaches(coaches.map(coach => 
        coach._id === currentCoach._id ? { ...coach, ...formData } : coach
      ));
      
      setIsEditModalOpen(false);
      showMessage('Coach updated successfully');
    } catch (err) {
      console.error('Error updating coach:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update coach';
      showMessage(errorMsg, true);
    }
  };

  const handleDeleteCoach = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };

      await axios.delete(
        `http://localhost:5000/api/coaches/${currentCoach._id}`,
        config
      );
      
      // Update local state
      setCoaches(coaches.filter(coach => coach._id !== currentCoach._id));
      
      setIsDeleteModalOpen(false);
      showMessage('Coach deleted successfully');
    } catch (err) {
      console.error('Error deleting coach:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete coach';
      showMessage(errorMsg, true);
      setIsDeleteModalOpen(false);
    }
  };

  const filteredCoaches = coaches.filter(coach =>
    coach.coachId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coach.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Coaches Management</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Coach ID or name..."
            className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>
      
      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoaches.map((coach) => (
                  <tr key={coach._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.coachId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{coach.hourlyRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.students?.length || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => openEditModal(coach)}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={() => openDeleteModal(coach)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Coach</h2>
            <form onSubmit={handleUpdateCoach}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Coach ID
                </label>
                <input
                  type="text"
                  className="border rounded w-full py-2 px-3 text-gray-700 bg-gray-100"
                  value={currentCoach?.coachId || ''}
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  name="hourlyRate"
                  className="border rounded w-full py-2 px-3 text-gray-700"
                  value={formData.hourlyRate}
                  onChange={handleInputChange}
                  required
                  min="0"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete coach <span className="font-bold">{currentCoach?.name}</span> ({currentCoach?.coachId})?
              This action cannot be undone.
            </p>
            <div className="flex justify-end">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={handleDeleteCoach}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Coaches;