import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const GroupMembersModal = ({ isOpen, onClose, group, currentUser }) => {
  const [groupMembers, setGroupMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriendToInvite, setSelectedFriendToInvite] = useState('');

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (group && group.id) {
        const groupDocRef = doc(db, "groups", group.id);
        const groupDocSnap = await getDoc(groupDocRef);
        if (groupDocSnap.exists() && groupDocSnap.data().members) {
          const memberUids = groupDocSnap.data().members;
          const memberDetails = await Promise.all(
            memberUids.map(async (uid) => {
              const userDocRef = doc(db, "users", uid);
              const userDocSnap = await getDoc(userDocRef);
              return userDocSnap.exists() ? { id: uid, ...userDocSnap.data() } : null;
            })
          );
          setGroupMembers(memberDetails.filter(Boolean));
        } else {
          setGroupMembers([]);
        }
      }
    };

    const fetchFriends = async () => {
      if (currentUser && currentUser.uid) {
        const friendsCollectionRef = collection(db, "users", currentUser.uid, "friends");
        const friendsData = [];
        const friendsSnapshot = await getDocs(friendsCollectionRef);
        for (const friendDoc of friendsSnapshot.docs) {
          const friendUserDocRef = doc(db, "users", friendDoc.id);
          const friendUserDocSnap = await getDoc(friendUserDocRef);
          if (friendUserDocSnap.exists()) {
            friendsData.push({ id: friendDoc.id, ...friendUserDocSnap.data() });
          }
        }
        setFriends(friendsData);
      }
    };

    if (isOpen) {
      fetchGroupDetails();
      fetchFriends();
    }
  }, [isOpen, group, currentUser]);

  const handleInviteFriend = async () => {
    if (!selectedFriendToInvite || !group || !currentUser) {
      toast.error("Vui lòng chọn bạn bè và nhóm.");
      return;
    }

    const friendToInvite = friends.find(f => f.id === selectedFriendToInvite);
    if (!friendToInvite) {
      toast.error("Bạn bè không hợp lệ.");
      return;
    }

    // Check if already a member
    if (groupMembers.some(member => member.id === selectedFriendToInvite)) {
      toast.error("Người này đã là thành viên của nhóm.");
      return;
    }

    // Check if invitation already sent
    const existingInvitationQuery = query(
      collection(db, "groupInvitations"),
      where("groupId", "==", group.id),
      where("receiverId", "==", selectedFriendToInvite),
      where("status", "==", "pending")
    );
    const existingInvitationSnapshot = await getDocs(existingInvitationQuery);
    if (!existingInvitationSnapshot.empty) {
      toast.error("Lời mời đã được gửi đến người này.");
      return;
    }

    try {
      await addDoc(collection(db, "groupInvitations"), {
        groupId: group.id,
        groupName: group.name,
        senderId: currentUser.uid,
        senderName: currentUser.fullName || currentUser.email,
        receiverId: selectedFriendToInvite,
        receiverName: friendToInvite.fullName || friendToInvite.email,
        status: "pending",
        timestamp: new Date(),
      });
      toast.success(`Đã gửi lời mời đến ${friendToInvite.fullName || friendToInvite.email}!`);
      setSelectedFriendToInvite('');
    } catch (error) {
      console.error("Error sending group invitation:", error);
      toast.error("Gửi lời mời thất bại.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!group || !currentUser || !group.id) return;

    // Prevent removing the group creator (optional, but good practice)
    if (group.creatorId === memberId) {
      toast.error("Không thể xóa người tạo nhóm.");
      return;
    }

    try {
      const groupDocRef = doc(db, "groups", group.id);
      await updateDoc(groupDocRef, {
        members: arrayRemove(memberId)
      });
      toast.success("Đã xóa thành viên khỏi nhóm.");
      // Re-fetch members to update the list in the modal
      const groupDocSnap = await getDoc(groupDocRef);
      if (groupDocSnap.exists() && groupDocSnap.data().members) {
        const memberUids = groupDocSnap.data().members;
        const memberDetails = await Promise.all(
          memberUids.map(async (uid) => {
            const userDocRef = doc(db, "users", uid);
            const userDocSnap = await getDoc(userDocRef);
            return userDocSnap.exists() ? { id: uid, ...userDocSnap.data() } : null;
          })
        );
        setGroupMembers(memberDetails.filter(Boolean));
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Xóa thành viên thất bại.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-teal-600">Quản lý thành viên nhóm: {group?.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>

        {/* Group Members Section */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-xl font-bold text-teal-600 mb-3">Thành viên hiện tại</h3>
          {groupMembers.length > 0 ? (
            <ul>
              {groupMembers.map(member => (
                <li key={member.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <img src={member.profile_img} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <span>{member.fullName || member.email} {member.id === group.creatorId && '(Trưởng nhóm)'}</span>
                  </div>
                  {currentUser && currentUser.uid === group.creatorId && member.id !== currentUser.uid && (
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="bg-red-500 text-white text-xs rounded-full px-3 py-1 hover:bg-red-600"
                    >
                      Xóa
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Chưa có thành viên nào trong nhóm.</p>
          )}
        </div>

        {/* Invite Friends Section */}
        {currentUser && currentUser.uid === group.creatorId && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-xl font-bold text-teal-600 mb-3">Mời bạn bè vào nhóm</h3>
            <div className="flex space-x-2">
              <select
                value={selectedFriendToInvite}
                onChange={(e) => setSelectedFriendToInvite(e.target.value)}
                className="border border-gray-300 rounded-lg p-2 flex-1"
              >
                <option value="">Chọn bạn bè</option>
                {friends.map(friend => (
                  <option key={friend.id} value={friend.id}>
                    {friend.fullName || friend.email}
                  </option>
                ))}
              </select>
              <button
                onClick={handleInviteFriend}
                className="bg-teal-500 text-white rounded-lg p-2 hover:bg-teal-600"
              >
                Mời
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMembersModal;
