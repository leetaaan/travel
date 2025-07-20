import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';
import TopMenu from '../components/TopMenu';
import Sidebar from '../components/Sidebar';
import MapDashboard from '../components/MapDashboard';
import SpendingManagement from '../components/SpendingManagement';

const HomePage = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useState(null);
  const { isDark } = useTheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-dark-900 transition-colors duration-300">
      <TopMenu />
      <div className="flex flex-1 overflow-hidden">
        {user ? (
          <Sidebar onSelectGroup={setSelectedGroup} tripId="trip123" userId={user.uid} />
        ) : (
          <div className="bg-gray-100 dark:bg-dark-800 p-4 h-full w-64 flex flex-col border-r border-gray-200 dark:border-dark-700">
             <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400 mb-4">Groups</h2>
             <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-gray-500 dark:text-gray-400">Please log in to see your groups.</p>
             </div>
          </div>
        )}
        <main className="flex-1 p-4 overflow-y-auto bg-white dark:bg-dark-900">
          {selectedGroup ? (
            <SpendingManagement group={selectedGroup} currentUser={user} />
          ) : (
            <MapDashboard />
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
