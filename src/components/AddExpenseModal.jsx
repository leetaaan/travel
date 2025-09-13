import React, { useState, useEffect } from 'react';
import { formatVND, formatNumber } from '../utils/formatVND';
import { recognizeExpense } from '../utils/geminiUtils';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AddExpenseModal = ({ isOpen, onClose, onSave, expense, group, currentUser }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]); // [{id, fullName, email, profile_img}]
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [paidById, setPaidById] = useState('');

  useEffect(() => {
    const initializeFromExpense = () => {
      if (expense) {
        setName(expense.name || '');
        setPrice(expense.price !== undefined && expense.price !== null ? formatNumber(Number(expense.price)) : '');
        setSelectedMemberIds(Array.isArray(expense.participants) ? expense.participants : []);
        setPaidById(expense.paidBy || expense.createdBy || currentUser?.uid || '');
      } else {
        setName('');
        setPrice('');
        setImage(null);
        setPaidById(currentUser?.uid || '');
      }
    };

    initializeFromExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expense, currentUser]);

  useEffect(() => {
    const fetchGroupMembers = async () => {
      if (!isOpen || !group?.id) return;
      try {
        const groupDocRef = doc(db, 'groups', group.id);
        const groupSnap = await getDoc(groupDocRef);
        const memberUids = groupSnap.exists() && Array.isArray(groupSnap.data().members) ? groupSnap.data().members : [];
        const memberDetails = await Promise.all(
          memberUids.map(async (uid) => {
            try {
              const userDocRef = doc(db, 'users', uid);
              const userSnap = await getDoc(userDocRef);
              return userSnap.exists() ? { id: uid, ...userSnap.data() } : null;
            } catch (e) {
              console.error('Error fetching user for member list:', e);
              return null;
            }
          })
        );
        const validMembers = memberDetails.filter(Boolean);
        setMembers(validMembers);
        // Default selections
        if (!expense || !Array.isArray(expense.participants) || expense.participants.length === 0) {
          setSelectedMemberIds(validMembers.map((m) => m.id));
        } else {
          const limited = expense.participants.filter((id) => validMembers.some((m) => m.id === id));
          setSelectedMemberIds(limited);
        }
        // Ensure paidBy is valid; default to currentUser if not in group
        const proposedPayer = expense?.paidBy || expense?.createdBy || currentUser?.uid || '';
        if (proposedPayer && validMembers.some((m) => m.id === proposedPayer)) {
          setPaidById(proposedPayer);
        } else if (validMembers.length > 0) {
          setPaidById(validMembers[0].id);
        } else {
          setPaidById('');
        }
      } catch (error) {
        console.error('Error fetching group members:', error);
        setMembers([]);
        setSelectedMemberIds([]);
      }
    };

    fetchGroupMembers();
  }, [isOpen, group, expense, currentUser]);

  const toggleMember = (memberId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const allSelected = members.length > 0 && selectedMemberIds.length === members.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map((m) => m.id));
    }
  };

  const resetFields = () => {
    setName('');
    setPrice('');
    setImage(null);
    setSelectedMemberIds([]);
    setPaidById(currentUser?.uid || '');
  };

  const handleSave = () => {
    const numeric = String(price).replace(/[^0-9.-]/g, '');
    const parsedPrice = parseFloat(numeric);
    if (name.trim() && !isNaN(parsedPrice)) {
      onSave({ name, price: parsedPrice, participants: selectedMemberIds, paidBy: paidById });
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
        const { name, price } = await recognizeExpense(image);
        setName(name);
        setPrice(price !== undefined && price !== null ? formatNumber(Number(price)) : '');
      } catch (error) {
        console.error('Error recognizing expense:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
        <h2 className="text-2xl font-bold text-teal-600 mb-4">{expense ? 'Sửa chi tiêu' : 'Thêm chi tiêu'}</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="border border-gray-300 rounded-lg p-2 w-full mb-4"
        />
        {image && (
          <div className="mb-4">
            <img src={image} alt="Uploaded receipt" className="max-h-40 mx-auto" />
            <button
              onClick={handleRecognize}
              className="bg-blue-500 text-white rounded-lg p-2 w-full mt-2 hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Nhận diện chi tiêu'}
            </button>
          </div>
        )}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-4"
          placeholder="Tên chi tiêu"
        />
        <input
          type="text"
          value={price}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            if (raw === '') {
              setPrice('');
            } else {
              const num = parseInt(raw, 10);
              if (!isNaN(num)) {
                setPrice(formatNumber(num));
              }
            }
          }}
          className="border border-gray-300 rounded-lg p-2 w-full mb-2"
          placeholder="Giá thành"
          inputMode="numeric"
        />

        {/* Payer selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Người trả</label>
          <select
            className="border border-gray-300 rounded-lg p-2 w-full"
            value={paidById}
            onChange={(e) => setPaidById(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.fullName || m.email}</option>
            ))}
          </select>
        </div>

        {/* Members selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-teal-600">Thành viên tham gia</h3>
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-sm text-teal-600 hover:underline"
            >
              {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded p-2">
            {members.length === 0 ? (
              <p className="text-gray-500 text-sm">Không có thành viên nào trong nhóm.</p>
            ) : (
              members.map((m) => (
                <label key={m.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                  />
                  <span>{m.fullName || m.email}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              resetFields();
              onClose();
            }}
            className="bg-gray-300 text-gray-700 rounded-lg p-2 hover:bg-gray-400"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            className="bg-teal-500 text-white rounded-lg p-2 hover:bg-teal-600"
          >
            {expense ? 'Cập nhật' : 'Thêm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseModal;
