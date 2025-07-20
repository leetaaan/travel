import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { generateRandomAvatar } from '../utils/avatarUtils';

const AuthForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState(null);
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const avatarUrl = generateRandomAvatar();
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          fullName: fullName,
          profile_img: avatarUrl,
          createdAt: new Date(),
        });
        toast.success('Đăng ký thành công!');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Đăng nhập thành công!');
      }
      navigate('/home');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 dark:bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRegistering ? 'Đăng ký tài khoản' : 'Đăng nhập'}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {isRegistering ? 'Tạo tài khoản mới để bắt đầu hành trình' : 'Chào mừng bạn trở lại'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {isRegistering && (
              <div>
                <label htmlFor="full-name" className="sr-only">Full Name</label>
                <input
                  id="full-name"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-dark-500"
                  placeholder="Họ và tên"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-dark-500"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 dark:hover:border-dark-500"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 dark:text-red-300 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center">
                {isRegistering ? 'Đăng ký' : 'Đăng nhập'}
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
              </span>
            </button>
          </div>
          
          <div className="text-center">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)} 
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors"
            >
              {isRegistering ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
            </button>
          </div>
        </form>
    </div>
  );
};

export default AuthForm;
