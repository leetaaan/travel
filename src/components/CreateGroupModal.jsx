import React, { useState } from 'react';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup }) => {
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreate = () => {
    if (newGroupName.trim() !== '') {
      onCreateGroup(newGroupName);
      setNewGroupName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-teal-600 mb-4">Tạo nhóm mới</h2>
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          placeholder="Tên nhóm mới"
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 rounded-lg p-2 hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            className="bg-teal-500 text-white rounded-lg p-2 hover:bg-teal-600"
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;
