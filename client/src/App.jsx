import React from 'react';
import { useApp } from './contexts/AppContext';
import AuthPage from './components/AuthPage';
import MainLayout from './components/MainLayout';
import ToastContainer from './components/ui/ToastContainer';
import LevelUpModal from './components/ui/LevelUpModal';
import AchievementModal from './components/ui/AchievementModal';

export default function App() {
  const { loading, user } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🏃</div>
          <p className="text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? <MainLayout /> : <AuthPage />}
      <ToastContainer />
      <LevelUpModal />
      <AchievementModal />
    </>
  );
}
