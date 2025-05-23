import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('attendance');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [coachId, setCoachId] = useState('');
  const [salaryData, setSalaryData] = useState(null);
  const [coachData, setCoachData] = useState(null);
  const [error, setError] = useState('');

  // Fetch coach data with populated students
  useEffect(() => {
    const fetchCoachData = async () => {
      try {
        setError('');
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const res = await axios.get('http://localhost:5000/api/coaches/singleCoach', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCoachId(res.data._id);
        setCoachData(res.data);
        setStudents(res.data.students || []);
      } catch (err) {
        console.error('Error fetching coach data:', err);
        setError('Failed to load coach data');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchCoachData();
  }, [navigate]);

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const promises = Object.entries(attendance).map(([studentId, status]) => 
        axios.post('http://localhost:5000/api/attendance/mark', {
          studentId,
          status,
          date, // Make sure to include the date
          coachId,
          sessionDuration: 60 // or get from your form
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      );
      
      await Promise.all(promises);
      setSuccess('Attendance marked successfully!');
      setTimeout(() => setSuccess(''), 3000);
      setAttendance({});
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Attendance already marked for one or more students');
      } else {
        setError('Failed to mark attendance');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateSalary = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const currentDate = new Date();
      
      const res = await axios.get(
        `http://localhost:5000/api/attendance/salary/${coachId}`,
        {
          params: {
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear()
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setSalaryData(res.data);
    } catch (err) {
      console.error('Error calculating salary:', err);
      setError(err.response?.data?.message || 'Failed to calculate salary');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
          <div className="space-x-4">
            <button 
              onClick={() => navigate('/profile')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              My Profile
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['attendance', 'salary', 'students'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
                >
                  {tab === 'attendance' ? 'Mark Attendance' : 
                   tab === 'salary' ? 'Salary Report' : 'My Students'}
                </button>
              ))}
            </nav>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Tab Content */}
          <div className="bg-white shadow rounded-lg p-6 mt-6">
            {activeTab === 'attendance' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
                <form onSubmit={handleSubmitAttendance}>
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Date:</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="border p-2 rounded w-full max-w-xs"
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    {students.length > 0 ? (
                      students.map(student => (
                        <div key={student._id} className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">
                            {student.name} ({student.studentId})
                          </span>
                          <div className="space-x-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`attendance-${student._id}`}
                                checked={attendance[student._id] === 'present'}
                                onChange={() => handleStatusChange(student._id, 'present')}
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">Present</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`attendance-${student._id}`}
                                checked={attendance[student._id] === 'absent'}
                                onChange={() => handleStatusChange(student._id, 'absent')}
                                className="form-radio h-4 w-4 text-indigo-600"
                              />
                              <span className="ml-2">Absent</span>
                            </label>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No students assigned to you yet.</p>
                    )}
                  </div>
                  
                  {students.length > 0 && (
                    <button
                      type="submit"
                      disabled={loading || Object.keys(attendance).length === 0}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Save Attendance'}
                    </button>
                  )}
                </form>
              </div>
            )}

            {activeTab === 'salary' && (
              <div>
                <h2 className="text-xl font-bold mb-4">Salary Report</h2>
                <button
                  onClick={calculateSalary}
                  disabled={!coachId}
                  className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300"
                >
                  Calculate Current Month Salary
                </button>
                
                {salaryData ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Salary Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Month:</p>
                        <p className="font-medium">{salaryData.month}/{salaryData.year}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Sessions:</p>
                        <p className="font-medium">{salaryData.totalSessions}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Hours:</p>
                        <p className="font-medium">{salaryData.totalHours?.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Hourly Rate:</p>
                        <p className="font-medium">₹{salaryData.hourlyRate?.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2 border-t pt-2">
                        <p className="text-gray-600">Total Salary:</p>
                        <p className="font-bold text-xl">₹{salaryData.outstandingSalary?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    {coachId ? 'Click the button to calculate salary' : 'Loading coach data...'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'students' && (
              <div>
                <h2 className="text-xl font-bold mb-4">My Students</h2>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joining Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map(student => (
                          <tr key={student._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {student.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {student.joiningDate ? new Date(student.joiningDate).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No students assigned to you yet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoachDashboard;