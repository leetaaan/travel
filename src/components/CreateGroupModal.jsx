import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, PlusCircle } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup }) => {
  const [newGroupName, setNewGroupName] = useState("");

  const handleCreate = () => {
    if (newGroupName.trim() !== "") {
      onCreateGroup(newGroupName);
      setNewGroupName("");
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white/90 backdrop-blur-2xl p-8 md:p-12 rounded-[50px] shadow-2xl border border-white/60 max-w-xl w-full relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-500 rounded-[20px] shadow-lg shadow-emerald-500/20 flex items-center justify-center">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                      Tạo nhóm mới
                    </h2>
                    <p className="text-slate-500 font-medium">
                      Bắt đầu hành trình cùng bạn bè
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 rounded-full bg-white/40 hover:bg-white/60 transition-colors border border-white/60 group"
                >
                  <X className="w-6 h-6 text-slate-400 group-hover:text-slate-800 transition-colors" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest ml-1">
                    Tên nhóm của bạn
                  </label>
                  <div className="relative group">
                    <input
                      type="text"
                      autoFocus
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full bg-white/40 border-2 border-white/60 focus:border-emerald-500/50 rounded-3xl h-20 px-8 text-xl font-bold shadow-sm transition-all outline-none placeholder:text-slate-400 placeholder:font-medium"
                      placeholder="VD: Hội Phượt Miền Trung"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 h-16 rounded-full font-black text-lg text-slate-600 bg-white/40 border border-white/60 hover:bg-white/60 transition-all hover:shadow-xl active:scale-95"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={!newGroupName.trim()}
                    className="flex-[2] btn-liquid h-16 group"
                  >
                    <div className="btn-liquid-shine" />
                    <span className="relative z-10 flex items-center gap-3">
                      Xác nhận tạo nhóm
                    </span>
                  </button>
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

export default CreateGroupModal;
