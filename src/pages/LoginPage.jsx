import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  const { isDark } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center p-6 transition-colors duration-300">
        <div className="w-full max-w-md p-8 space-y-8 bg-white/80 dark:bg-dark-800/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 dark:border-dark-600/20">
            <AuthForm />
        </div>
    </div>
  );
};

export default LoginPage;
