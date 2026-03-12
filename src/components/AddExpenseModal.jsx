import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  Camera,
  DollarSign,
  Users,
  CheckCircle2,
  Sparkles,
  User,
} from "lucide-react";
import { formatVND, formatNumber } from "../utils/formatVND";
import { recognizeExpenseWithGemini as recognizeExpense } from "../utils/geminiService";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

const AddExpenseModal = ({
  isOpen,
  onClose,
  onSave,
  expense,
  group,
  currentUser,
}) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [paidById, setPaidById] = useState("");

  useEffect(() => {
    const initializeFromExpense = () => {
      if (expense) {
        setName(expense.name || "");
        setPrice(
          expense.price !== undefined && expense.price !== null
            ? formatNumber(Number(expense.price))
            : "",
        );
        setSelectedMemberIds(
          Array.isArray(expense.participants) ? expense.participants : [],
        );
        setPaidById(
          expense.paidBy || expense.createdBy || currentUser?.uid || "",
        );
      } else {
        setName("");
        setPrice("");
        setImage(null);
        setPaidById(currentUser?.uid || "");
      }
    };

    initializeFromExpense();
  }, [expense, currentUser]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!isOpen || !group?.id) return;
      try {
        const groupDocRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupDocRef);
        const memberUids =
          groupSnap.exists() && Array.isArray(groupSnap.data().members)
            ? groupSnap.data().members
            : [];
        const memberDetails = await Promise.all(
          memberUids.map(async (uid) => {
            try {
              const userDocRef = doc(db, "users", uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              return null;
            }
          }),
        );
        const validMembers = memberDetails.filter(Boolean);
        setMembers(validMembers);

        if (
          !expense ||
          !Array.isArray(expense.participants) ||
          expense.participants.length === 0
        ) {
          setSelectedMemberIds(validMembers.map((m) => m.id));
        } else {
          const limited = expense.participants.filter((id) =>
            validMembers.some((m) => m.id === id),
          );
          setSelectedMemberIds(limited);
        }

        const proposedPayer =
          expense?.paidBy || expense?.createdBy || currentUser?.uid || "";
        if (proposedPayer && validMembers.some((m) => m.id === proposedPayer)) {
          setPaidById(proposedPayer);
        } else if (validMembers.length > 0) {
          setPaidById(validMembers[0].id);
        } else {
          setPaidById("");
        }
      } catch (error) {
        setMembers([]);
        setSelectedMemberIds([]);
      }
    };

    fetchGroupMembers();
  }, [isOpen, group, expense, currentUser]);

  const toggleMember = (memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  const allSelected =
    members.length > 0 && selectedMemberIds.length === members.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map((m) => m.id));
    }
  };

  const resetFields = () => {
    setName("");
    setPrice("");
    setImage(null);
    setSelectedMemberIds([]);
    setPaidById(currentUser?.uid || "");
  };

  const handleSave = () => {
    // Xử lý giá tiền: loại bỏ tất cả dấu chấm (phân cách nghìn) trước khi parse
    const cleanPrice = String(price).replace(/\./g, "").replace(/[^0-9.-]/g, "");
    const parsedPrice = parseFloat(cleanPrice);
    
    if (name.trim() && !isNaN(parsedPrice)) {
      onSave({
        name,
        price: parsedPrice,
        participants: selectedMemberIds,
        paidBy: paidById,
      });
      resetFields();
      onClose();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRecognize = async () => {
    if (image) {
      setLoading(true);
      try {
        const { name: recName, price: recPrice } =
          await recognizeExpense(image);
        if (recName) setName(recName);
        if (recPrice) setPrice(formatNumber(Number(recPrice)));
      } catch (error) {
        console.error("Error recognizing expense:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="bg-white/95 backdrop-blur-2xl p-6 sm:p-10 rounded-[40px] sm:rounded-[50px] shadow-2xl border border-white/60 max-w-4xl w-full max-h-[90vh] flex flex-col relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Design accents */}
            <div className="absolute top-0 right-0 -mr-32 -mt-32 w-96 h-96 bg-emerald-400/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Receipt className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      {expense ? "Sửa chi tiêu" : "Thêm chi tiêu nhanh"}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Nhập tay hoặc quét hóa đơn AI
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

              <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-8 pr-2">
                {/* Left Column: Form Info */}
                <div className="space-y-6">
                  {/* Image/AI Section */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Quét hóa đơn thông minh
                    </label>
                    {!image ? (
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-white/60 rounded-3xl bg-white/40 hover:bg-white/60 transition-all cursor-pointer group shadow-sm">
                        <div className="bg-white/80 p-4 rounded-2xl mb-2 group-hover:scale-110 transition-transform shadow-sm">
                          <Camera className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-sm font-bold text-slate-600">
                          Bấm để tải ảnh lên
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-3xl overflow-hidden border-2 border-white/60 bg-slate-100/50 group shadow-sm">
                        <img
                          src={image}
                          alt="Receipt"
                          className="w-full h-48 object-cover opacity-80"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setImage(null)}
                            className="p-3 bg-red-500 text-white rounded-full transition-transform hover:scale-110"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <button
                          onClick={handleRecognize}
                          disabled={loading}
                          className="absolute bottom-4 left-4 right-4 h-12 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-600 active:scale-95 transition-all"
                        >
                          {loading ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1 }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                          ) : (
                            <Sparkles className="w-4 h-4" />
                          )}
                          {loading ? "Đang phân tích..." : "Phân tích bằng AI"}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                        Tên chi tiêu
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-16 bg-white border-2 border-slate-200 focus:border-emerald-500/50 rounded-2xl px-6 font-bold text-slate-800 transition-all outline-none shadow-sm placeholder:text-slate-300"
                          placeholder="VD: Ăn tối Đà Lạt"
                        />
                        <Receipt className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-1">
                        Giá thành (VNĐ)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, "");
                            const num = parseInt(raw, 10);
                            setPrice(isNaN(num) ? "" : formatNumber(num));
                          }}
                          className="w-full h-16 bg-white border-2 border-slate-200 focus:border-emerald-500/50 rounded-2xl px-6 font-black text-slate-800 text-xl transition-all outline-none shadow-sm"
                          placeholder="0"
                          inputMode="numeric"
                        />
                        <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Participants */}
                <div className="space-y-6 flex flex-col h-full">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                      Người thanh toán
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setPaidById(m.id)}
                          className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                            paidById === m.id
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-800"
                              : "bg-white/30 border-white/40 text-slate-500 hover:bg-white/50"
                          }`}
                        >
                          <img
                            src={m.profile_img}
                            className="w-8 h-8 rounded-xl object-cover"
                          />
                          <span className="text-sm font-bold truncate">
                            {m.id === currentUser?.uid
                              ? "Tôi"
                              : m.fullName || m.email}
                          </span>
                          {paidById === m.id && (
                            <CheckCircle2 className="w-4 h-4 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                        Chia cho ai?
                      </label>
                      <button
                        onClick={toggleSelectAll}
                        className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter hover:underline"
                      >
                        {allSelected ? "Bỏ chọn hết" : "Chọn tất cả"}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-2">
                      {members.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => toggleMember(m.id)}
                          className={`flex items-center gap-4 p-4 rounded-[24px] border transition-all cursor-pointer ${
                            selectedMemberIds.includes(m.id)
                              ? "bg-white/60 border-emerald-500/50 shadow-sm"
                              : "bg-white/10 border-white/20 opacity-60 hover:opacity-100"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedMemberIds.includes(m.id)
                                ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20"
                                : "border-slate-300"
                            }`}
                          >
                            {selectedMemberIds.includes(m.id) && (
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <img
                            src={m.profile_img}
                            className="w-10 h-10 rounded-xl"
                          />
                          <div className="flex-1">
                            <p
                              className={`font-black text-sm uppercase ${selectedMemberIds.includes(m.id) ? "text-slate-800" : "text-slate-400"}`}
                            >
                              {m.fullName || m.email}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400">
                              {selectedMemberIds.includes(m.id)
                                ? "Đang tham gia"
                                : "Không tính"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-white/40 mt-6">
                <button
                  onClick={() => {
                    resetFields();
                    onClose();
                  }}
                  className="flex-1 h-16 rounded-full font-black text-lg text-slate-600 bg-white/40 border border-white/60 hover:bg-white/60 transition-all active:scale-95"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    !name.trim() || !price || selectedMemberIds.length === 0
                  }
                  className="flex-[2] btn-liquid h-16 group"
                >
                  <div className="btn-liquid-shine" />
                  <span className="relative z-10 flex items-center gap-3">
                    {expense ? "Lưu thay đổi" : "Tạo khoản chi"}
                    <CheckCircle2 className="w-6 h-6" />
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AddExpenseModal;
