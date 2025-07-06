import React from 'react';
import AuthForm from '../components/AuthForm';

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
            <AuthForm />
        </div>
    </div>
  );
};

export default LoginPage;
