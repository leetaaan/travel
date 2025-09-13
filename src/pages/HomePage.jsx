import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useTheme } from '../contexts/ThemeContext';
import TopMenu from '../components/TopMenu';
import Sidebar from '../components/Sidebar';
import MapDashboard from '../components/MapDashboard';
import SpendingManagement from '../components/SpendingManagement';



const HomePage = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [user, setUser] = useState(null);
  const { isDark } = useTheme();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData({ ...docSnap.data(), uid: currentUser.uid });
          } else {
            setUserData({ uid: currentUser.uid, email: currentUser.email });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData({ uid: currentUser.uid, email: currentUser.email });
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F7] dark:bg-dark-900 transition-colors duration-300">
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
            <SpendingManagement group={selectedGroup} currentUser={userData} />
          ) : (
            <MapDashboard />
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;