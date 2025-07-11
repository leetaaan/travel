import React, { useState } from 'react';
import AddExpenseModal from './AddExpenseModal';
import { FaEdit, FaTrash } from 'react-icons/fa';

const SpendingTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const handleSaveExpense = ({ name, price }) => {
    if (editingExpense) {
      setExpenses(expenses.map(exp => exp.id === editingExpense.id ? { ...exp, name, price } : exp));
    } else {
      setExpenses([...expenses, { id: Date.now(), name, price, date: new Date() }]);
    }
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
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
              <td className="border px-4 py-2">{new Date(expense.date).toLocaleDateString()}</td>
              <td className="border px-4 py-2">
                <button onClick={() => handleEdit(expense)} className="bg-yellow-500 text-white rounded-lg p-1 mr-2 hover:bg-yellow-600" title="Sửa">
                  <FaEdit />
                </button>
                <button onClick={() => handleDelete(expense.id)} className="bg-red-500 text-white rounded-lg p-1 hover:bg-red-600" title="Xóa">
                  <FaTrash />
                </button>
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