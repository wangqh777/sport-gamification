import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { api } from '../api';
import DashboardView from './dashboard/Dashboard';
import ExerciseView from './exercise/ExerciseLog';
import QuestView from './quests/QuestBoard';
import AchievementView from './achievements/AchievementWall';
import SocialView from './social/SocialHub';
import TeamView from './team/TeamHub';
import PKView from './pk/PKArena';
import MatchView from './social/AnonymousMatch';
import ShopView from './shop/Shop';

const TABS = [
  { key: 'dashboard', label: '🏰 主城', icon: '🏰' },
  { key: 'exercise', label: '🏃 训练', icon: '🏃' },
  { key: 'quests', label: '📋 任务', icon: '📋' },
  { key: 'achievements', label: '🏆 成就', icon: '🏆' },
  { key: 'social', label: '👥 社交', icon: '👥' },
  { key: 'team', label: '🤝 组队', icon: '🤝' },
  { key: 'pk', label: '⚔️ PK', icon: '⚔️' },
  { key: 'match', label: '🔍 约跑', icon: '🔍' },
  { key: 'shop', label: '🛒 商店', icon: '🛒' },
];

const CLASS_ICONS = { warrior: '⚔️', archer: '🏹', mage: '🔮', default: '⚔️' };

export default function MainLayout() {
  const { user, logout, refreshUser, addToast } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState(user);

  useEffect(() => {
    const interval = setInterval(() => {
      api.getUser(user.id).then(d => setUserData(d.user)).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [user.id]);

  useEffect(() => {
    setUserData(user);
  }, [user]);

  const avatar = CLASS_ICONS[userData?.class] || CLASS_ICONS.default;

  const renderView = () => {
    const props = { userData, refreshUser };
    switch (activeTab) {
      case 'dashboard': return <DashboardView {...props} />;
      case 'exercise': return <ExerciseView {...props} />;
      case 'quests': return <QuestView {...props} />;
      case 'achievements': return <AchievementView {...props} />;
      case 'social': return <SocialView {...props} />;
      case 'team': return <TeamView {...props} />;
      case 'pk': return <PKView {...props} />;
      case 'match': return <MatchView {...props} />;
      case 'shop': return <ShopView {...props} />;
      default: return <DashboardView {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-surface-dark/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            🔥 燃动Fit
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">✨ {userData?.xp || 0} XP</span>
            <span className="text-sm text-amber-400">🪙 {userData?.coins || 0}</span>
            <span className="text-sm text-rose-400">🔥 {userData?.streak || 0}天</span>
            <div className="flex items-center gap-2 bg-surface-light rounded-full pl-1 pr-3 py-1 border border-white/5">
              <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm">{avatar}</span>
              <span className="text-sm font-semibold">{userData?.username}</span>
              <span className="text-xs text-gray-500">Lv.{userData?.level}</span>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-red-400 text-sm transition-colors">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-14 z-40 bg-surface/90 backdrop-blur-xl border-b border-white/5 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 py-2">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-light'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {renderView()}
      </main>
    </div>
  );
}
