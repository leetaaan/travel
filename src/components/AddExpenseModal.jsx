import React, { useState, useEffect } from 'react';
import { formatVND } from '../utils/formatVND';
import { recognizeExpense } from '../utils/geminiUtils';

const AddExpenseModal = ({ isOpen, onClose, onSave, expense }) => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setName(expense.name);
      setPrice(String(expense.price));
    } else {
      setName('');
      setPrice('');
      setImage(null);
    }
  }, [expense]);

  const handleSave = () => {
    const parsedPrice = parseFloat(price);
    if (name.trim() && !isNaN(parsedPrice)) {
      onSave({ name, price: parsedPrice });
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
        setPrice(String(price));
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
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="border border-gray-300 rounded-lg p-2 w-full mb-2"
          placeholder="Giá thành"
        />
        {price && !isNaN(parseFloat(price)) && (
          <p className="text-gray-600 text-sm mb-4">Giá: {formatVND(parseFloat(price))}</p>
        )}
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              onClose();
              setImage(null);
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
