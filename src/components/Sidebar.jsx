import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
} from "firebase/firestore";
import { useTheme } from "../contexts/ThemeContext";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = ({ onSelectGroup, tripId, userId }) => {
  const [groups, setGroups] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    if (userId) {
      // Query groups where the 'members' array contains the current userId
      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", userId),
      );
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
      const docRef = await addDoc(collection(db, "groups"), newGroup);
      onSelectGroup({ ...newGroup, id: docRef.id });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent p-6 overflow-hidden">
      <div className="mb-8">
        <button
          onClick={() => onSelectGroup(null)}
          className="btn-liquid btn-liquid-secondary p-4 w-full group"
        >
          <div className="btn-liquid-shine" />

          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 relative z-10">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
              ></path>
            </svg>
          </div>
          <span className="relative z-10 transition-colors group-hover:text-emerald-900">
            Bản đồ du lịch
          </span>
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1 flex items-center">
          <span className="w-8 h-[1px] bg-slate-200 mr-2"></span>
          Danh sách nhóm
          <span className="w-8 h-[1px] bg-slate-200 ml-2"></span>
        </h2>

        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => onSelectGroup(group)}
                className="flex items-center space-x-4 w-full text-left p-4 rounded-2xl hover:bg-white/60 transition-all duration-300 group border border-transparent hover:border-white/80 hover:shadow-xl hover:shadow-black/5"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-lg font-black group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                  {group.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-700 font-bold truncate group-hover:text-primary transition-colors">
                    {group.name}
                  </p>
                  <div className="flex items-center mt-0.5">
                    <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {group.members?.length || 0} thành viên
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M9 5l7 7-7 7"
                  ></path>
                </svg>
              </button>
            ))
          ) : (
            <div className="text-center py-12 bg-white/20 rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
                <svg
                  className="w-8 h-8 text-slate-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
              </div>
              <p className="text-slate-500 font-bold text-sm">Chưa có nhóm</p>
              <p className="text-slate-400 text-[10px] mt-1 uppercase tracking-widest">
                Tạo nhóm đầu tiên
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-liquid w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 group"
        >
          <div className="btn-liquid-shine" />
          <span className="text-xl relative z-10 transition-transform group-hover:scale-105">
            Tạo nhóm mới
          </span>
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
