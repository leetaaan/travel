import React, { useState } from 'react';
import SpendingTable from './SpendingTable';
import GroupMembersModal from './GroupMembersModal';

const SpendingManagement = ({ group, currentUser }) => {
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Chọn một nhóm để xem chi tiết.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold text-teal-600">Quản lý chi tiêu cho: {group.name}</h2>
        {currentUser && currentUser.uid === group.creatorId && (
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="bg-teal-500 text-white rounded-lg px-4 py-2 hover:bg-teal-600"
          >
            Quản lý thành viên
          </button>
        )}
      </div>
      <p className="text-gray-700 mb-6">Tại đây bạn có thể theo dõi và quản lý các khoản chi tiêu của nhóm.</p>

      <div className="mb-8">
        <SpendingTable />
      </div>

      <GroupMembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        group={group}
        currentUser={currentUser}
      />
    </div>
  );
};

export default SpendingManagement;