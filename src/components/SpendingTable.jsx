import React, { useState, useEffect, useCallback } from 'react';
import AddExpenseModal from './AddExpenseModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/utils/formatVND";

const SpendingTable = ({ group, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [participantsMap, setParticipantsMap] = useState({}); // { userId: {id, fullName, email, profile_img} }
  const [memberMap, setMemberMap] = useState({}); // { userId: {id, fullName, email, profile_img} }
  const [isResultOpen, setIsResultOpen] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!group) return;
    try {
      const expensesCollection = collection(db, 'expenses');
      const q = query(expensesCollection, where('groupId', '==', group.id));
      const expensesSnapshot = await getDocs(q);
      const expensesList = expensesSnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const date = data.date && data.date.toDate ? data.date.toDate() : new Date();
        return { id: docSnap.id, ...data, date };
      });
      setExpenses(expensesList);
    } catch (error) {
      console.error("Error fetching expenses: ", error);
      if (error.code === 'permission-denied') {
        toast.error('Bạn không có quyền xem dữ liệu chi tiêu của nhóm này.');
      } else {
        toast.error('Có lỗi xảy ra khi tải dữ liệu chi tiêu.');
      }
    }
  }, [group]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Fetch group members' profiles for display in results
  useEffect(() => {
    const fetchMembers = async () => {
      if (!group?.id) return;
      try {
        const groupDocRef = doc(db, 'groups', group.id);
        const groupSnap = await getDoc(groupDocRef);
        const uids = groupSnap.exists() && Array.isArray(groupSnap.data().members) ? groupSnap.data().members : [];
        const results = await Promise.all(
          uids.map(async (uid) => {
            try {
              const userDocRef = doc(db, 'users', uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              console.error('Error fetching member profile', e);
              return null;
            }
          })
        );
        const next = {};
        results.filter(Boolean).forEach((u) => { next[u.id] = u; });
        setMemberMap(next);
      } catch (e) {
        console.error('Error fetching group members', e);
      }
    };
    fetchMembers();
  }, [group]);

  // Fetch unique participants' profiles for display in table cells
  useEffect(() => {
    const fetchParticipantsProfiles = async () => {
      try {
        const uniqueIds = new Set();
        expenses.forEach(exp => {
          (exp.participants || []).forEach(id => uniqueIds.add(id));
          if (exp.paidBy) uniqueIds.add(exp.paidBy);
        });
        const idsToFetch = Array.from(uniqueIds).filter(id => !participantsMap[id]);
        if (idsToFetch.length === 0) return;
        const results = await Promise.all(
          idsToFetch.map(async (uid) => {
            try {
              const userDocRef = doc(db, 'users', uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              console.error('Error fetching user profile', e);
              return null;
            }
          })
        );
        const nextMap = { ...participantsMap };
        results.filter(Boolean).forEach(user => {
          nextMap[user.id] = user;
        });
        setParticipantsMap(nextMap);
      } catch (e) {
        console.error('Error building participants map', e);
      }
    };
    if (expenses.length > 0) {
      fetchParticipantsProfiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses]);

  const handleSaveExpense = async ({ name, price, participants, paidBy }) => {
    if (!currentUser || !group) {
      toast.error("Không thể lưu chi tiêu: thiếu thông tin người dùng hoặc nhóm.");
      return;
    }

    try {
      if (editingExpense) {
        const expenseDoc = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expenseDoc, { name, price, participants: participants || [], paidBy: paidBy || currentUser.uid });
        toast.success('Đã cập nhật chi tiêu.');
      } else {
        await addDoc(collection(db, 'expenses'), {
          name,
          price,
          date: new Date(),
          groupId: group.id,
          createdBy: currentUser.uid,
          paidBy: paidBy || currentUser.uid,
          participants: participants || [],
        });
        toast.success('Đã thêm chi tiêu.');
      }
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense: ", error);
      if (error.code === 'permission-denied') {
        toast.error('Bạn không có quyền thực hiện thao tác này.');
      } else {
        toast.error('Có lỗi xảy ra khi lưu chi tiêu.');
      }
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const expenseDoc = doc(db, 'expenses', id);
      await deleteDoc(expenseDoc);
      toast.success('Đã xóa chi tiêu.');
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense: ", error);
      if (error.code === 'permission-denied') {
        toast.error('Bạn không có quyền xóa chi tiêu này.');
      } else {
        toast.error('Có lỗi xảy ra khi xóa chi tiêu.');
      }
    }
  };

  const canEditDelete = (expense) => {
    if (!currentUser || !group) return false;
    return expense.createdBy === currentUser.uid || group.creatorId === currentUser.uid;
  };

  const renderParticipantsCell = (expense) => {
    const ids = expense.participants || [];
    if (ids.length === 0) return <span className="text-gray-500">-</span>;
    return (
      <div className="flex flex-wrap gap-2">
        {ids.map((id) => {
          const user = participantsMap[id];
          const name = user?.fullName || user?.email || 'Ẩn danh';
          const avatar = user?.profile_img;
          return (
            <div key={id} className="flex items-center space-x-2 bg-gray-100 rounded-full px-2 py-1">
              {avatar ? (
                <img src={avatar} alt={name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm">{name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const computeResults = () => {
    const paidBy = {}; // userId -> total paid
    const shareBy = {}; // userId -> total share

    // initialize with group members to ensure all appear
    Object.keys(memberMap).forEach((uid) => {
      paidBy[uid] = 0;
      shareBy[uid] = 0;
    });

    expenses.forEach((exp) => {
      const participants = Array.isArray(exp.participants) && exp.participants.length > 0 ? exp.participants : [];
      const count = participants.length || 1;
      const perHead = Number(exp.price || 0) / count;
      // paidBy field overrides createdBy
      const payer = exp.paidBy || exp.createdBy;
      if (payer) {
        paidBy[payer] = (paidBy[payer] || 0) + Number(exp.price || 0);
      }
      // each participant owes their share
      participants.forEach((uid) => {
        shareBy[uid] = (shareBy[uid] || 0) + perHead;
      });
    });

    const results = Object.keys({ ...memberMap, ...paidBy, ...shareBy }).map((uid) => {
      const user = memberMap[uid];
      const paid = +(paidBy[uid] || 0);
      const share = +(shareBy[uid] || 0);
      const net = +(paid - share);
      return { uid, user, paid, share, net };
    });

    // sort: highest absolute net first
    results.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
    return results;
  };

  const results = isResultOpen ? computeResults() : [];

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
        >
          Thêm chi tiêu
        </Button>
        {currentUser && group && currentUser.uid === group.creatorId && (
          <Button variant="secondary" onClick={() => setIsResultOpen(true)}>
            Kết quả tính
          </Button>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Thành viên</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map(expense => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.name}</TableCell>
              <TableCell>{formatVND(expense.price)}</TableCell>
              <TableCell>{expense.date.toLocaleDateString()}</TableCell>
              <TableCell>{renderParticipantsCell(expense)}</TableCell>
              <TableCell>
                {canEditDelete(expense) ? (
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => handleEdit(expense)} title="Sửa">
                      <FaEdit />
                    </Button>
                    <Button size="icon" variant="destructive" onClick={() => handleDelete(expense.id)} title="Xóa">
                      <FaTrash />
                    </Button>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="text-right font-bold" colSpan={1}>Tổng cộng</TableCell>
            <TableCell className="font-bold">
              {formatVND(expenses.reduce((total, exp) => total + parseFloat(exp.price || 0), 0))}
            </TableCell>
            <TableCell colSpan={3}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      {/* Results Modal */}
      {isResultOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-indigo-600">Kết quả tính theo thành viên</CardTitle>
              <Button variant="ghost" onClick={() => setIsResultOpen(false)} aria-label="Đóng">✕</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Thành viên</TableHead>
                    <TableHead className="text-right">Đã trả</TableHead>
                    <TableHead className="text-right">Phần chia</TableHead>
                    <TableHead className="text-right">Còn/Thừa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((row) => {
                    const name = row.user?.fullName || row.user?.email || row.uid;
                    const avatar = row.user?.profile_img;
                    return (
                      <TableRow key={row.uid}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-teal-500 text-white text-sm flex items-center justify-center">
                                {name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span>{name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatVND(row.paid)}</TableCell>
                        <TableCell className="text-right">{formatVND(row.share)}</TableCell>
                        <TableCell className={`text-right ${row.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatVND(row.net)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="mt-4 text-sm text-muted-foreground">
                Ghi chú: "Đã trả" tính theo trường người trả. "Phần chia" = tổng (chi tiêu / số người tham gia). "Còn/Thừa" = Đã trả - Phần chia.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
