import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  allowedRoles?: string[];
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectMap: Record<string, string> = {
      admin: '/dashboard',
      teacher: '/dashboard',
      student: '/my-lessons',
    };
    return <Navigate to={redirectMap[user.role] || '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <Header title={title} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
