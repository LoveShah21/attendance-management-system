// StudentDashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({ present: 0, totalDays: 0, percentage: 0 });
  const [filter, setFilter] = useState("month");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const token = localStorage.getItem("token");
        setLoading(true);
        
        // Fixed: Properly passing filter as a query parameter
        const response = await axios.get(
          `http://localhost:5000/api/students/attendance?filter=${filter}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        
        setAttendance(response.data.attendance);
        setStats(response.data.stats);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [filter, studentId]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <div className="space-x-4">
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              My Profile
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/login");
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
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Attendance Records
                </h3>
                <div className="flex space-x-2">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="month">This Month</option>
                    <option value="week">Last 7 Days</option>
                  </select>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                {loading ? (
                  <p>Loading attendance...</p>
                ) : (
                  <>
                    <div className="mb-4">
                      <h4 className="text-md font-medium text-gray-700">
                        Attendance Summary: {stats.present} out of{" "}
                        {stats.totalDays} days present ({stats.percentage}%)
                      </h4>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{
                            width: `${stats.percentage || 0}%`,
                            transition: "width 0.5s ease-in-out",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {attendance.length > 0 ? (
                            attendance.map((record) => (
                              <tr key={record._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(record.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span 
                                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      record.status === 'present' 
                                        ? 'bg-green-100 text-green-800' 
                                        : record.status === 'absent'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {record.status === 'present' 
                                      ? 'Present' 
                                      : record.status === 'absent'
                                      ? 'Absent'
                                      : 'Leave'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                className="px-6 py-4 text-center text-sm text-gray-500"
                              >
                                No attendance records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;