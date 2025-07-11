import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, arrayUnion } from 'firebase/firestore';
import CreateGroupModal from './CreateGroupModal';

const Sidebar = ({ onSelectGroup, tripId, userId }) => {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <div className="bg-gray-100 p-4 h-full w-64">
      <div className="mb-4">
        <a href="#" onClick={() => onSelectGroup(null)} className="text-teal-600 font-bold text-lg hover:text-teal-700">Bản đồ</a>
      </div>
      <h2 className="text-xl font-bold text-teal-600 mb-4">Danh sách nhóm</h2>
      <ul>
        {groups.map(group => (
          <li key={group.id} className="mb-2">
            <a href="#" onClick={() => onSelectGroup(group)} className="text-gray-700 hover:text-teal-500">{group.name}</a>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-500 text-white rounded-lg p-2 w-full hover:bg-teal-600"
        >
          Tạo nhóm
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