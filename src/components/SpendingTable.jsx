import React, { useState, useEffect, useCallback } from 'react';
import AddExpenseModal from './AddExpenseModal';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

const SpendingTable = ({ group, currentUser }) => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = useCallback(async () => {
    if (!group) return;
    try {
      const expensesCollection = collection(db, 'expenses');
      const q = query(expensesCollection, where('groupId', '==', group.id));
      const expensesSnapshot = await getDocs(q);
      const expensesList = expensesSnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date && data.date.toDate ? data.date.toDate() : new Date();
        return { id: doc.id, ...data, date };
      });
      setExpenses(expensesList);
    } catch (error) {
      console.error("Error fetching expenses: ", error);
      if (error.code === 'permission-denied') {
        alert('Bạn không có quyền xem dữ liệu chi tiêu của nhóm này.');
      } else {
        alert('Có lỗi xảy ra khi tải dữ liệu chi tiêu.');
      }
    }
  }, [group]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleSaveExpense = async ({ name, price }) => {
    if (!currentUser || !group) {
      alert("Không thể lưu chi tiêu: thiếu thông tin người dùng hoặc nhóm.");
      return;
    }

    try {
      if (editingExpense) {
        const expenseDoc = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expenseDoc, { name, price });
      } else {
        await addDoc(collection(db, 'expenses'), {
          name,
          price,
          date: new Date(),
          groupId: group.id,
          createdBy: currentUser.uid,
        });
      }
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense: ", error);
      if (error.code === 'permission-denied') {
        alert('Bạn không có quyền thực hiện thao tác này.');
      } else {
        alert('Có lỗi xảy ra khi lưu chi tiêu.');
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
      fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense: ", error);
      if (error.code === 'permission-denied') {
        alert('Bạn không có quyền xóa chi tiêu này.');
      } else {
        alert('Có lỗi xảy ra khi xóa chi tiêu.');
      }
    }
  };

  const canEditDelete = (expense) => {
    if (!currentUser || !group) return false;
    return expense.createdBy === currentUser.uid || group.creatorId === currentUser.uid;
  };

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => {
            setEditingExpense(null);
            setIsModalOpen(true);
          }}
          className="bg-teal-500 text-white rounded-lg p-2 hover:bg-teal-600"
        >
          Thêm chi tiêu
        </button>
      </div>
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">Tên</th>
            <th className="px-4 py-2">Giá</th>
            <th className="px-4 py-2">Ngày</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(expense => (
            <tr key={expense.id}>
              <td className="border px-4 py-2">{expense.name}</td>
              <td className="border px-4 py-2">{expense.price}</td>
              <td className="border px-4 py-2">{expense.date.toLocaleDateString()}</td>
              <td className="border px-4 py-2">
                {canEditDelete(expense) && (
                  <>
                    <button onClick={() => handleEdit(expense)} className="bg-yellow-500 text-white rounded-lg p-1 mr-2 hover:bg-yellow-600" title="Sửa">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(expense.id)} className="bg-red-500 text-white rounded-lg p-1 hover:bg-red-600" title="Xóa">
                      <FaTrash />
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-200 font-bold">
            <td className="border px-4 py-2 text-right" colSpan="1">Tổng cộng</td>
            <td className="border px-4 py-2">
              {expenses.reduce((total, exp) => total + parseFloat(exp.price || 0), 0).toLocaleString()}
            </td>
            <td className="border px-4 py-2" colSpan="2"></td>
          </tr>
        </tfoot>
      </table>
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
};

export default SpendingTable;
