import React, { useState, useEffect } from 'react';
import { api } from '../../api';

const TIER_LABELS = { novice: '新手成就', daily: '日常成就', challenge: '挑战成就', hidden: '隐藏成就' };
const TIER_COLORS = { novice: 'text-emerald-400', daily: 'text-blue-400', challenge: 'text-amber-400', hidden: 'text-violet-400' };

export default function AchievementWall({ userData }) {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAchievements(userData.id).then(d => {
      setAchievements(d.achievements || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [userData.id]);

  if (loading) return <div className="text-center py-8 text-gray-500">加载中...</div>;

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Group by tier
  const grouped = {};
  achievements.forEach(a => {
    const tier = a.tier || 'novice';
    if (!grouped[tier]) grouped[tier] = [];
    grouped[tier].push(a);
  });

  return (
    <div>
      <div className="mb-6">
        <h3 className="font-bold text-lg mb-1">🏆 成就殿堂</h3>
        <p className="text-sm text-gray-400">已解锁 {unlockedCount} / {achievements.length} 项成就</p>
        <div className="h-2 bg-surface-light rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all"
            style={{ width: `${(unlockedCount / (achievements.length || 1)) * 100}%` }} />
        </div>
      </div>

      {Object.entries(TIER_LABELS).map(([tier, label]) => {
        const items = grouped[tier] || [];
        if (items.length === 0) return null;
        return (
          <div key={tier} className="mb-6">
            <h4 className={`font-bold mb-3 ${TIER_COLORS[tier]}`}>{label}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {items.map(a => (
                <div
                  key={a.key}
                  className={`rounded-xl p-4 text-center transition-all border ${
                    a.unlocked
                      ? 'bg-surface border-amber-400/30 hover:border-amber-400/50'
                      : 'bg-surface border-white/5 opacity-50'
                  }`}
                >
                  <div className={`text-3xl mb-2 ${a.unlocked ? '' : 'grayscale'}`}>{a.icon || '🏆'}</div>
                  <div className={`font-bold text-sm ${a.unlocked ? '' : 'text-gray-500'}`}>{a.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{a.desc}</div>
                  {a.unlocked && <div className="text-xs text-amber-400 mt-1">✅ 已解锁</div>}
                  {!a.unlocked && a.tier === 'hidden' && <div className="text-xs text-gray-600 mt-1">???</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
