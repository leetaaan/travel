import React from 'react';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md p-8 space-y-8 bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
            <AuthForm />
        </div>
    </div>
  );
};

export default LoginPage;
