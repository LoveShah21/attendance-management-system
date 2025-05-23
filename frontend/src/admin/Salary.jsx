import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import axios from 'axios';

const Salary = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Correct format for headers
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        
        const [coachesRes, pendingRes] = await Promise.all([
          axios.get('http://localhost:5000/api/coaches', config),
          axios.get('http://localhost:5000/api/salary/total-pending', config)
        ]);
        
        setCoaches(coachesRes.data);
        setTotalPending(pendingRes.data.total);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [token]);

  const handlePaySalary = async (coachId) => {
    try {
      // Correct format for headers and body
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.post(
        `http://localhost:5000/api/salary/pay`, 
        { coachId }, // This is the request body
        config // This is the config object with headers
      );
      
      // Update local state
      setCoaches(coaches.map(coach => 
        coach._id === coachId 
          ? { ...coach, outstandingSalary: 0 } 
          : coach
      ));
      
      // Recalculate total pending
      const newTotal = coaches.reduce((sum, coach) => 
        sum + (coach._id === coachId ? 0 : coach.outstandingSalary || 0), 0);
      setTotalPending(newTotal);
    } catch (err) {
      console.error('Error paying salary:', err);
    }
  };

  const handlePayAll = async () => {
    try {
      // Correct format for headers
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      await axios.post(
        'http://localhost:5000/api/salary/pay-all', 
        {}, // Empty body or whatever your API expects
        config
      );
      
      // Update all coaches to have 0 outstanding salary
      setCoaches(coaches.map(coach => ({
        ...coach,
        outstandingSalary: 0
      })));
      
      setTotalPending(0);
    } catch (err) {
      console.error('Error paying all salaries:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Salary Management</h1>
        <div className="flex items-center space-x-4">
          <div className="bg-indigo-100 px-4 py-2 rounded-lg">
            <span className="text-indigo-800 font-medium">
              Total Pending: ₹{totalPending.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handlePayAll}
            disabled={totalPending === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-gray-400"
          >
            Pay All
          </button>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coach ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Salary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {coaches.map((coach) => (
                  <tr key={coach._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{coach.coachId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{coach.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{coach.hourlyRate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{(coach.outstandingSalary || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handlePaySalary(coach._id)}
                        disabled={!coach.outstandingSalary}
                        className={`px-3 py-1 rounded-md text-white ${coach.outstandingSalary ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
                      >
                        Pay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Salary;