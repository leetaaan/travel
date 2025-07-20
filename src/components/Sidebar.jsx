import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, arrayUnion } from 'firebase/firestore';
import { useTheme } from '../contexts/ThemeContext';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ onSelectGroup, tripId, userId }) => {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (userId) {
      // Query groups where the 'members' array contains the current userId
      const q = query(collection(db, 'groups'), where('members', 'array-contains', userId));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const groupsData = [];
        querySnapshot.forEach((doc) => {
          groupsData.push({ ...doc.data(), id: doc.id });
        });
        setGroups(groupsData);
      });
      return () => unsubscribe();
    }
  }, [userId]); // Depend only on userId for fetching groups

  const handleCreateGroup = async (newGroupName) => {
    if (userId) {
      const newGroup = {
        name: newGroupName,
        tripId: tripId, // Keep tripId if it's a general group property
        creatorId: userId, // Store the creator's ID
        members: [userId], // Initialize members array with the creator
        createdAt: new Date(),
      };
      const docRef = await addDoc(collection(db, 'groups'), newGroup);
      onSelectGroup({ ...newGroup, id: docRef.id });
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white dark:from-dark-800 dark:to-dark-900 border-r border-gray-200 dark:border-dark-700 p-6 h-full w-72 shadow-sm transition-colors duration-300">
      <div className="mb-6">
        <button 
          onClick={() => onSelectGroup(null)} 
          className="flex items-center space-x-3 text-primary-600 dark:text-primary-400 font-semibold text-lg hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gray-50 dark:hover:bg-dark-700 rounded-lg p-3 w-full transition-all duration-200 group"
        >
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"></path>
            </svg>
          </div>
          <span>Bản đồ</span>
        </button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          Danh sách nhóm
        </h2>
        
        {groups.length > 0 ? (
          <ul className="space-y-2">
            {groups.map(group => (
              <li key={group.id}>
                <button 
                  onClick={() => onSelectGroup(group)} 
                  className="flex items-center space-x-3 w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all duration-200 group border border-transparent hover:border-gray-200 dark:hover:border-dark-600"
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-semibold group-hover:scale-110 transition-transform">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 font-medium truncate">{group.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{group.members?.length || 0} thành viên</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Chưa có nhóm nào</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Tạo nhóm đầu tiên của bạn</p>
          </div>
        )}
      </div>
      
      <div className="mt-auto">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-4 transition-all duration-200 font-semibold shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span>Tạo nhóm mới</span>
        </button>
      </div>
      
      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
};

export default Sidebar;