import React from 'react';
import { Link } from 'react-router-dom';
import MapDashboard from '../components/MapDashboard';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-teal-500 text-white p-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Travel App</h1>
          <ul className="flex space-x-4">
            <li>
              <Link to="/planning" className="hover:text-gray-200">Planning</Link>
            </li>
            <li>
              <Link to="/group-management" className="hover:text-gray-200">Tạo nhóm quản lý chi tiêu</Link>
            </li>
            <li>
              <Link to="/search" className="hover:text-gray-200">Tìm kiếm</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="container mx-auto p-4">
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Welcome to your Travel Dashboard!</h2>
        <p className="text-gray-600">
          Here you can manage your travel plans, create expense groups, and search for new destinations.
        </p>
        <MapDashboard />
      </main>
    </div>
  );
};

export default HomePage;
