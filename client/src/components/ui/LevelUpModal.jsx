import React, { useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';

export default function LevelUpModal() {
  const { showLevelUp, setShowLevelUp } = useApp();

  useEffect(() => {
    if (showLevelUp) {
      const timer = setTimeout(() => setShowLevelUp(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp, setShowLevelUp]);

  if (!showLevelUp) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="level-up-pop text-center p-8 rounded-2xl bg-surface border-2 border-amber-400/30 shadow-2xl shadow-amber-400/10 max-w-sm mx-4">
        <div className="text-6xl mb-4">⬆️</div>
        <h2 className="text-2xl font-black text-amber-400 mb-2">等级提升！</h2>
        <p className="text-xl font-bold mb-1">Lv.{showLevelUp.oldLevel} → Lv.{showLevelUp.newLevel}</p>
        <p className="text-gray-400">解锁了新的能力！继续加油 🔥</p>
      </div>
    </div>
  );
}
