import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import AddExpenseModal from "./AddExpenseModal";
import {
  Edit3,
  Trash2,
  Plus,
  Calculator,
  X,
  ChevronRight,
  TrendingUp,
  Receipt,
  User,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { toast } from "react-hot-toast";
import { formatVND } from "@/utils/formatVND";

const SpendingTable = ({ group, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [participantsMap, setParticipantsMap] = useState({});
  const [memberMap, setMemberMap] = useState({});
  const [isResultOpen, setIsResultOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!group) return;
    try {
      const expensesCollection = collection(db, "expenses");
      const q = query(expensesCollection, where("groupId", "==", group.id));
      const expensesSnapshot = await getDocs(q);
      const expensesList = expensesSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const date =
          data.date && data.date.toDate ? data.date.toDate() : new Date();
        return { id: docSnap.id, ...data, date };
      });
      setExpenses(expensesList.sort((a, b) => b.date - a.date));
    } catch (error) {
      if (error.code === "permission-denied") {
        toast.error("Bạn không có quyền xem dữ liệu chi tiêu.");
      } else {
        toast.error("Có lỗi xảy ra khi tải dữ liệu chi tiêu.");
      }
    }
  }, [group]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!group?.id) return;
      try {
        const groupDocRef = doc(db, "groups", group.id);
        const groupSnap = await getDoc(groupDocRef);
        const uids =
          groupSnap.exists() && Array.isArray(groupSnap.data().members)
            ? groupSnap.data().members
            : [];
        const results = await Promise.all(
          uids.map(async (uid) => {
            try {
              const userDocRef = doc(db, "users", uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              return null;
            }
          }),
        );
        const next = {};
        results.filter(Boolean).forEach((u) => {
          next[u.id] = u;
        });
        setMemberMap(next);
      } catch (e) {
        console.error("Error fetching group members", e);
      }
    };
    fetchMembers();
  }, [group]);

  useEffect(() => {
    const fetchParticipantsProfiles = async () => {
      try {
        const uniqueIds = new Set();
        expenses.forEach((exp) => {
          (exp.participants || []).forEach((id) => uniqueIds.add(id));
          if (exp.paidBy) uniqueIds.add(exp.paidBy);
        });
        const idsToFetch = Array.from(uniqueIds).filter(
          (id) => !participantsMap[id],
        );
        if (idsToFetch.length === 0) return;
        const results = await Promise.all(
          idsToFetch.map(async (uid) => {
            try {
              const userDocRef = doc(db, "users", uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              return null;
            }
          }),
        );
        const nextMap = { ...participantsMap };
        results.filter(Boolean).forEach((user) => {
          nextMap[user.id] = user;
        });
        setParticipantsMap(nextMap);
      } catch (e) {
        console.error("Error building participants map", e);
      }
    };
    if (expenses.length > 0) {
      fetchParticipantsProfiles();
    }
  }, [expenses]);

  const handleSaveExpense = async ({ name, price, participants, paidBy }) => {
    if (!currentUser || !group) {
      toast.error("Thiếu thông tin người dùng hoặc nhóm.");
      return;
    }

    try {
      if (editingExpense) {
        const expenseDoc = doc(db, "expenses", editingExpense.id);
        await updateDoc(expenseDoc, {
          name,
          price,
          participants: participants || [],
          paidBy: paidBy || currentUser.uid,
        });
        toast.success("Đã cập nhật chi tiêu.");
      } else {
        await addDoc(collection(db, "expenses"), {
          name,
          price,
          date: new Date(),
          groupId: group.id,
          createdBy: currentUser.uid,
          paidBy: paidBy || currentUser.uid,
          participants: participants || [],
        });
        toast.success("Đã thêm chi tiêu.");
      }
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      if (error.code === "permission-denied") {
        toast.error("Bạn không có quyền này.");
      } else {
        toast.error("Có lỗi xảy ra khi lưu chi tiêu.");
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const expenseDoc = doc(db, "expenses", id);
      await deleteDoc(expenseDoc);
      toast.success("Đã xóa chi tiêu.");
      fetchExpenses();
    } catch (error) {
      toast.error("Xóa thất bại.");
    }
  };

  const canEditDelete = (expense) => {
    if (!currentUser || !group) return false;
    return (
      expense.createdBy === currentUser.uid ||
      group.creatorId === currentUser.uid
    );
  };

  const renderParticipantsCell = (expense) => {
    const ids = expense.participants || [];
    if (ids.length === 0) return <span className="text-slate-400">-</span>;

    const visibleIds = ids.slice(0, 3);
    const hiddenCount = ids.length - 3;

    return (
      <div className="flex -space-x-2">
        {visibleIds.map((id) => {
          const user = participantsMap[id];
          return (
            <div
              key={id}
              className="w-8 h-8 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center overflow-hidden"
              title={user?.fullName || user?.email}
            >
              {user?.profile_img ? (
                <img
                  src={user.profile_img}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-400" />
              )}
            </div>
          );
        })}
        {hiddenCount > 0 && (
          <div className="w-8 h-8 rounded-xl border-2 border-white bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  };

  const computeResults = () => {
    const paidBy = {};
    const shareBy = {};

    Object.keys(memberMap).forEach((uid) => {
      paidBy[uid] = 0;
      shareBy[uid] = 0;
    });

    expenses.forEach((exp) => {
      const participants =
        Array.isArray(exp.participants) && exp.participants.length > 0
          ? exp.participants
          : [];
      const count = participants.length || 1;
      const perHead = Number(exp.price || 0) / count;
      const payer = exp.paidBy || exp.createdBy;
      if (payer) {
        paidBy[payer] = (paidBy[payer] || 0) + Number(exp.price || 0);
      }
      participants.forEach((uid) => {
        shareBy[uid] = (shareBy[uid] || 0) + perHead;
      });
    });

    const results = Object.keys({ ...memberMap, ...paidBy, ...shareBy }).map(
      (uid) => {
        const user = memberMap[uid];
        const paid = +(paidBy[uid] || 0);
        const share = +(shareBy[uid] || 0);
        const net = +(paid - share);
        return { uid, user, paid, share, net };
      },
    );

    results.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    return results;
  };

  const results = isResultOpen ? computeResults() : [];

  const resultsModal = createPortal(
    <AnimatePresence>
      {isResultOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-[9999] p-4"
          onClick={() => setIsResultOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 30, opacity: 0 }}
            className="bg-white/95 backdrop-blur-3xl p-8 rounded-[40px] shadow-2xl border border-white/60 max-w-2xl w-full max-h-[85vh] flex flex-col relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Calculator className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                      Quyết toán chi phí
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      Chi tiết nợ/thặng dư
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsResultOpen(false)}
                  className="p-2 rounded-full hover:bg-white/50 transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                {results.map((row) => {
                  const name =
                    row.user?.fullName || row.user?.email || "Thành viên";
                  return (
                    <div
                      key={row.uid}
                      className="flex items-center justify-between p-4 bg-white/50 border border-white rounded-[24px]"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={row.user?.profile_img}
                          className="w-10 h-10 rounded-xl bg-slate-100"
                        />
                        <div>
                          <p className="font-black text-slate-800 text-sm uppercase">
                            {name}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400">
                            Đã trả: {formatVND(row.paid)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-black text-sm ${row.net >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {row.net >= 0 ? "+" : ""}
                          {formatVND(row.net)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          Net balance
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 italic text-[10px] text-emerald-700 font-medium">
                Ghi chú: Giá trị dương (+) là số tiền bạn sẽ nhận lại, giá trị
                âm (-) là số tiền bạn cần trả thêm vào quỹ.
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  return (
    <div className="space-y-6">
      {/* Table Header Controls */}
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[32px] border border-white/60 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 text-sm tracking-tight leading-none">
              Bảng chi tiêu
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              Tổng {expenses.length} khoản chi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentUser && group && currentUser.uid === group.creatorId && (
            <button
              onClick={() => setIsResultOpen(true)}
              className="btn-liquid-secondary h-12 px-6 rounded-2xl flex items-center gap-2 hover:-translate-y-0.5"
            >
              <Calculator className="w-4 h-4" />
              <span className="text-xs font-black">QUYẾT TOÁN</span>
            </button>
          )}
          <button
            onClick={() => {
              setEditingExpense(null);
              setIsModalOpen(true);
            }}
            className="btn-liquid h-12 px-6 rounded-2xl flex items-center gap-2 group hover:-translate-y-0.5"
          >
            <div className="btn-liquid-shine" />
            <Plus className="w-4 h-4 relative z-10" />
            <span className="text-xs font-black relative z-10">THÊM MỚI</span>
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[40px] border border-white/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white">
                  Nội dung
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white">
                  Số tiền
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white">
                  Ngày
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white">
                  Thành viên
                </th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="hover:bg-white/40 transition-colors group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-50 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="font-bold text-slate-700">
                        {expense.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-black text-slate-800">
                      {formatVND(expense.price)}
                    </span>
                  </td>
                  <td className="p-6 text-slate-500 font-bold text-xs uppercase">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                      {expense.date.toLocaleDateString("vi-VN")}
                    </div>
                  </td>
                  <td className="p-6">{renderParticipantsCell(expense)}</td>
                  <td className="p-6 text-right">
                    {canEditDelete(expense) ? (
                      <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="w-10 h-10 bg-white/50 hover:bg-emerald-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center border border-white shadow-sm transition-all"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="w-10 h-10 bg-white/50 hover:bg-red-500 text-slate-400 hover:text-white rounded-xl flex items-center justify-center border border-white shadow-sm transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-emerald-50/50">
                <td
                  colSpan={1}
                  className="p-6 font-black text-emerald-800 text-sm uppercase tracking-tight"
                >
                  Tổng cộng
                </td>
                <td className="p-6 font-black text-emerald-600 text-lg">
                  {formatVND(
                    expenses.reduce(
                      (total, exp) => total + parseFloat(exp.price || 0),
                      0,
                    ),
                  )}
                </td>
                <td colSpan={3} className="p-6"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {resultsModal}

      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
        group={group}
        currentUser={currentUser}
      />
    </div>
  );
};

export default SpendingTable;
