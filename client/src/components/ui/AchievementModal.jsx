import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function AchievementModal() {
  const { showAchievement, setShowAchievement } = useApp();

  useEffect(() => {
    if (showAchievement) {
      const timer = setTimeout(() => setShowAchievement(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [showAchievement, setShowAchievement]);

  if (!showAchievement) return null;

  const ach = Array.isArray(showAchievement) ? showAchievement[0] : showAchievement;

  return (
    <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
      <div className="achievement-glow text-center p-8 rounded-2xl bg-surface border-2 border-gold/30 shadow-2xl max-w-sm mx-4">
        <div className="text-5xl mb-3">{ach?.icon || '🏆'}</div>
        <h2 className="text-lg font-black text-amber-400 mb-1">成就解锁！</h2>
        <p className="text-xl font-bold">{ach?.name || '新成就'}</p>
        <p className="text-gray-400 text-sm mt-1">{ach?.desc || ''}</p>
      </div>
    </div>
  );
}
