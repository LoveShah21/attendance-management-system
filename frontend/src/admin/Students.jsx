import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignCoachData, setAssignCoachData] = useState({
    studentId: '',
    coachId: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [coachFilter, setCoachFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Correct format for headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const [studentsRes, coachesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/students', config),
        axios.get('http://localhost:5000/api/coaches', config)
      ]);
      
      setStudents(studentsRes.data);
      setCoaches(coachesRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      fetchData();
    } else {
      console.warn("No token found, fetch aborted.");
    }
  }, []);

  // Helper function to determine if a student has a coach assigned
  const hasCoach = (student) => {
    return student.coachId && (typeof student.coachId === 'object' ? true : !!student.coachId);
  };

  // Filter students based on search term and coach assignment status
  const filteredStudents = students.filter(student => {
    // Text search filter
    const matchesSearch = student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Coach assignment filter
    const matchesCoachFilter = 
      coachFilter === 'all' || 
      (coachFilter === 'assigned' && hasCoach(student)) || 
      (coachFilter === 'unassigned' && !hasCoach(student));
    
    return matchesSearch && matchesCoachFilter;
  });

  const handleAssignCoach = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      };
      
      const response = await axios.put(
        `http://localhost:5000/api/students/${assignCoachData.studentId}/assign-coach`,
        { coachId: assignCoachData.coachId },
        config
      );
            
      // Refresh data instead of updating state directly
      // This ensures we get the full populated data from the server
      fetchData();
      
      setShowAssignModal(false);
    } catch (err) {
      console.error('Error assigning coach:', err);
      // Add error handling for user feedback
      alert(err.response?.data?.message || 'Failed to assign coach');
    }
  };

  const openAssignCoachModal = (student) => {
    setAssignCoachData({
      studentId: student._id,
      coachId: student.coachId && student.coachId._id ? student.coachId._id : 
               typeof student.coachId === 'string' ? student.coachId : ''
    });
    setShowAssignModal(true);
  };

  // Helper function to get coach display name
  const getCoachDisplayName = (student) => {
    if (!student.coachId) return 'Not assigned';
    
    if (typeof student.coachId === 'object') {
      return `${student.coachId.name} (${student.coachId.coachId})`;
    }
    
    // If coachId is just an ID string, find the coach in coaches array
    const coach = coaches.find(c => c._id === student.coachId);
    return coach ? `${coach.name} (${coach.coachId})` : 'Not assigned';
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students Management</h1>
        <div className="flex space-x-4">
          {/* Coach Assignment Filter */}
          <div className="relative">
            <span className='text-s font-medium text-gray-500'>filter by: </span>
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
            >
              <option value="all">All Students</option>
              <option value="assigned">With Coach</option>
              <option value="unassigned">Without Coach</option>
            </select>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by Student ID or name..."
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
      </div>
      
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasCoach(student) ? (
                          <span className="font-medium text-green-600">
                            {getCoachDisplayName(student)}
                          </span>
                        ) : (
                          <span className="text-red-500">Not assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          onClick={() => openAssignCoachModal(student)}
                          className={`${
                            hasCoach(student) 
                              ? "text-blue-600 hover:text-blue-900" 
                              : "text-indigo-600 hover:text-indigo-900 font-medium"
                          }`}
                        >
                          {hasCoach(student) ? "Change Coach" : "Assign Coach"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No students found matching the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Assign Coach Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {assignCoachData.coachId ? "Change Coach" : "Assign Coach"}
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Coach</label>
              <select
                className="w-full border rounded-md p-2"
                value={assignCoachData.coachId}
                onChange={(e) => setAssignCoachData({
                  ...assignCoachData,
                  coachId: e.target.value
                })}
              >
                <option value="">Select a coach</option>
                {coaches.map(coach => (
                  <option key={coach._id} value={coach._id}>
                    {coach.name} ({coach.coachId})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCoach}
                disabled={!assignCoachData.coachId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300"
              >
                {assignCoachData.coachId ? "Save Changes" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Students;