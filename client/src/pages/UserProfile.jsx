import React from 'react';

import { CustomButton } from "../components/index.js";
const UserProfile = () => {
  return (
    <div className="bg-gray-50 min-h-screen px-6 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">User Profile</h2>
      
      <div className="max-w-md">
        {/* User Profile Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">USER PROFILE</h3>
            < div className="text-gray-400" size={20} />
          </div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              < div size={32} className="text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block">First Name:</label>
                  <input 
                    type="text" 
                    defaultValue="John" 
                    className="text-sm font-medium w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Last Name:</label>
                  <input 
                    type="text" 
                    defaultValue="Doe" 
                    className="text-sm font-medium w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block">Email:</label>
                  <input 
                    type="email" 
                    defaultValue="john.doe@email.com" 
                    className="text-sm font-medium w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm w-full">
              Update Profile
            </button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded text-sm w-full">
              Change Password
            </button>
            <div className="flex space-x-2">
              <button className="bg-green-500 text-white px-3 py-2 rounded text-sm flex-1">
                View Order History
              </button>
              <button className="bg-orange-500 text-white px-3 py-2 rounded text-sm flex-1">
                View Designs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
