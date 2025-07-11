import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import TopMenu from '../components/TopMenu';
import Sidebar from '../components/Sidebar';
import MapDashboard from '../components/MapDashboard';
import SpendingManagement from '../components/SpendingManagement';

const HomePage = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <TopMenu />
      <div className="flex flex-1 overflow-hidden">
        {user ? (
          <Sidebar onSelectGroup={setSelectedGroup} tripId="trip123" userId={user.uid} />
        ) : (
          <div className="bg-gray-100 p-4 h-full w-64 flex flex-col">
             <h2 className="text-xl font-bold text-teal-600 mb-4">Groups</h2>
             <div className="flex-1 flex items-center justify-center">
                <p className="text-center text-gray-500">Please log in to see your groups.</p>
             </div>
          </div>
        )}
        <main className="flex-1 p-4 overflow-y-auto">
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
