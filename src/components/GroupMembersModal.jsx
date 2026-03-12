import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, UserPlus, Shield, UserMinus, UserCheck } from "lucide-react";
import Select from "react-select";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { toast } from "react-hot-toast";

const GroupMembersModal = ({ isOpen, onClose, group, currentUser }) => {
  const [groupMembers, setGroupMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriendToInvite, setSelectedFriendToInvite] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Custom styles for react-select to match premium aesthetic
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.6)",
      backdropFilter: "blur(8px)",
      border: "2px solid rgba(255, 255, 255, 0.6)",
      borderRadius: "20px",
      padding: "0 10px",
      height: "56px",
      fontSize: "0.95rem",
      fontWeight: "700",
      color: "#1e293b",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(16, 185, 129, 0.1)" : "none",
      borderColor: state.isFocused
        ? "rgba(16, 185, 129, 0.3)"
        : "rgba(255, 255, 255, 0.6)",
      cursor: "pointer",
      "&:hover": {
        borderColor: "rgba(16, 185, 129, 0.4)",
      },
    }),
    placeholder: (base) => ({
      ...base,
      color: "#94a3b8",
      fontWeight: "600",
    }),
    singleValue: (base) => ({
      ...base,
      color: "#1e293b",
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(12px)",
      borderRadius: "24px",
      border: "1px solid rgba(255, 255, 255, 0.6)",
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      padding: "8px",
      marginTop: "8px",
      overflow: "hidden",
      zIndex: 1000,
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#10b981"
        : state.isFocused
          ? "rgba(16, 185, 129, 0.1)"
          : "transparent",
      color: state.isSelected ? "white" : "#1e293b",
      fontWeight: state.isSelected ? "800" : "600",
      padding: "12px 20px",
      borderRadius: "14px",
      marginBottom: "4px",
      cursor: "pointer",
      "&:active": {
        backgroundColor: "#10b981",
        color: "white",
      },
    }),
    indicatorSeparator: () => ({ display: "none" }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#94a3b8",
      "&:hover": {
        color: "#10b981",
      },
    }),
  };

  const friendOptions = friends.map((f) => ({
    value: f.id,
    label: f.fullName || f.email,
  }));

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (group && group.id) {
        try {
          const groupDocRef = doc(db, "groups", group.id);
          const groupDocSnap = await getDoc(groupDocRef);
          if (groupDocSnap.exists() && groupDocSnap.data().members) {
            const memberUids = groupDocSnap.data().members;
            const memberDetails = await Promise.all(
              memberUids.map(async (uid) => {
                try {
                  const userDocRef = doc(db, "users", uid);
                  const userDocSnap = await getDoc(userDocRef);
                  return userDocSnap.exists()
                    ? { id: uid, ...userDocSnap.data() }
                    : null;
                } catch (error) {
                  return null;
                }
              }),
            );
            setGroupMembers(memberDetails.filter(Boolean));
          }
        } catch (error) {
          toast.error("Không thể tải thông tin thành viên.");
        }
      }
    };

    const fetchFriends = async () => {
      if (currentUser && currentUser.uid) {
        try {
          const friendsCollectionRef = collection(
            db,
            "users",
            currentUser.uid,
            "friends",
          );
          const friendsSnapshot = await getDocs(friendsCollectionRef);
          const friendsData = [];
          for (const friendDoc of friendsSnapshot.docs) {
            const friendUserDocRef = doc(db, "users", friendDoc.id);
            const friendUserDocSnap = await getDoc(friendUserDocRef);
            if (friendUserDocSnap.exists()) {
              friendsData.push({
                id: friendDoc.id,
                ...friendUserDocSnap.data(),
              });
            }
          }
          setFriends(friendsData);
        } catch (error) {
          toast.error("Không thể tải danh sách bạn bè.");
        }
      }
    };

    if (isOpen) {
      fetchGroupDetails();
      fetchFriends();
    }
  }, [isOpen, group, currentUser]);

  const handleInviteFriend = async () => {
    if (!selectedFriendToInvite || !group || !currentUser) {
      toast.error("Vui lòng chọn bạn bè.");
      return;
    }

    if (groupMembers.some((member) => member.id === selectedFriendToInvite)) {
      toast.error("Người này đã là thành viên.");
      return;
    }

    setIsLoading(true);
    try {
      const groupDocRef = doc(db, "groups", group.id);
      await updateDoc(groupDocRef, {
        members: arrayUnion(selectedFriendToInvite),
      });

      toast.success("Đã thêm vào nhóm!");

      const friend = friends.find((f) => f.id === selectedFriendToInvite);
      if (friend) setGroupMembers((prev) => [...prev, friend]);
      setSelectedFriendToInvite("");
    } catch (error) {
      toast.error("Thêm thành viên thất bại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!group || !currentUser || !group.id) return;
    if (group.creatorId === memberId) {
      toast.error("Không thể xóa trưởng nhóm.");
      return;
    }

    try {
      const groupDocRef = doc(db, "groups", group.id);
      await updateDoc(groupDocRef, {
        members: arrayRemove(memberId),
      });
      toast.success("Đã xóa khỏi nhóm.");
      setGroupMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error) {
      toast.error("Xóa thất bại.");
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[9999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white/90 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl border border-white/60 max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-400/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      Thành viên nhóm
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      {group?.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              {/* Invite Section */}
              {currentUser?.uid === group?.creatorId && (
                <div className="mb-8 p-6 bg-white/40 rounded-3xl border border-white/60 shadow-inner">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4 ml-1">
                    Mời thêm bạn bè
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Select
                        options={friendOptions}
                        value={friendOptions.find(
                          (o) => o.value === selectedFriendToInvite,
                        )}
                        onChange={(option) =>
                          setSelectedFriendToInvite(option ? option.value : "")
                        }
                        placeholder="Chọn bạn bè để mời..."
                        styles={customSelectStyles}
                        noOptionsMessage={() => "Không còn bạn bè nào để mời"}
                      />
                    </div>
                    <button
                      onClick={handleInviteFriend}
                      disabled={isLoading || !selectedFriendToInvite}
                      className="btn-liquid px-8 h-14 group shrink-0"
                    >
                      <div className="btn-liquid-shine" />
                      <span className="relative z-10 font-bold whitespace-nowrap">
                        Mời ngay
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-2">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
                  Đang tham gia ({groupMembers.length})
                </h3>
                <div className="space-y-3">
                  {groupMembers.map((member) => (
                    <motion.div
                      layout
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-white/30 hover:bg-white/50 border border-white/40 rounded-[24px] transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={member.profile_img}
                            alt="Avatar"
                            className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-slate-100"
                          />
                          {member.id === group.creatorId && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                              <Shield className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 flex items-center gap-2">
                            {member.fullName || member.email}
                            {member.id === currentUser?.uid && (
                              <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-tighter">
                                Bạn
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 font-medium">
                            {member.id === group.creatorId
                              ? "Trưởng nhóm"
                              : "Thành viên"}
                          </p>
                        </div>
                      </div>

                      {currentUser?.uid === group?.creatorId &&
                        member.id !== currentUser.uid && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="w-10 h-10 rounded-xl bg-red-100/50 hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <UserMinus className="w-5 h-5" />
                          </button>
                        )}

                      {member.id === group.creatorId && (
                        <div className="w-10 h-10 rounded-xl bg-amber-100/30 text-amber-500 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default GroupMembersModal;
