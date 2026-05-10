import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

// Quest generation logic (mirrors the game concept from the original SPA)
const DAILY_QUEST_TEMPLATES = [
  { id:'dq_run', name:'晨跑达人', desc:'跑步 {target} 公里', target:3, unit:'km', type:'running', track:'distance', icon:'🏃', reward:80 },
  { id:'dq_train', name:'训练时刻', desc:'完成 {target} 分钟训练', target:30, unit:'min', type:'any', track:'duration', icon:'⏱️', reward:80 },
  { id:'dq_cal', name:'燃脂挑战', desc:'消耗 {target} 卡路里', target:250, unit:'cal', type:'any', track:'calories', icon:'🔥', reward:80 },
  { id:'dq_hiit', name:'爆发训练', desc:'完成1次HIIT', target:1, unit:'次', type:'hiit', track:'count', icon:'💪', reward:100 },
];

// Generate deterministic daily quests based on date
function getDailyQuests() {
  const seed = new Date().toISOString().slice(0, 10);
  return DAILY_QUEST_TEMPLATES.map(q => ({ ...q, desc: q.desc.replace('{target}', q.target) }));
}

const INTENSITY_MULT = { low: 0.7, medium: 1.0, high: 1.5 };
const EX_CAL_PER_MIN = { running: 10, strength: 8, cycling: 9, swimming: 11, yoga: 5, hiit: 14, basketball: 9, jump_rope: 12, pushup: 8, situp: 7 };

export default function QuestBoard({ userData, refreshUser }) {
  const { addToast } = useApp();
  const [activities, setActivities] = useState([]);
  const [claimed, setClaimed] = useState([]);

  const dailyQuests = useMemo(() => getDailyQuests(), []);

  useEffect(() => {
    api.getHistory(userData.id, 100).then(d => setActivities(d.activities || [])).catch(() => {});
    const saved = localStorage.getItem(`quests_claimed_${new Date().toISOString().slice(0,10)}`);
    if (saved) setClaimed(JSON.parse(saved));
  }, [userData.id]);

  const getQuestProgress = (quest) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayActivities = activities.filter(a => a.createdAt?.slice(0, 10) === todayStr);

    if (quest.track === 'distance') {
      return todayActivities.filter(a => a.type === quest.type)
        .reduce((s, a) => s + a.duration * 0.15, 0); // ~9km/h
    }
    if (quest.track === 'duration') {
      if (quest.type === 'any') return todayActivities.reduce((s, a) => s + a.duration, 0);
      return todayActivities.filter(a => a.type === quest.type).reduce((s, a) => s + a.duration, 0);
    }
    if (quest.track === 'calories') {
      if (quest.type === 'any') return todayActivities.reduce((s, a) => s + a.calories, 0);
      return todayActivities.filter(a => a.type === quest.type).reduce((s, a) => s + a.calories, 0);
    }
    if (quest.track === 'count') {
      return todayActivities.filter(a => a.type === quest.type).length;
    }
    return 0;
  };

  const claimQuest = (quest) => {
    if (claimed.includes(quest.id)) return;
    const progress = getQuestProgress(quest);
    if (progress < quest.target) return;
    const newClaimed = [...claimed, quest.id];
    setClaimed(newClaimed);
    localStorage.setItem(`quests_claimed_${new Date().toISOString().slice(0,10)}`, JSON.stringify(newClaimed));
    addToast('🎁 任务完成！', `${quest.name}：获得 +${quest.reward} XP`, 'success');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="font-bold text-lg mb-2">📋 每日任务</h3>
      <p className="text-sm text-gray-400 mb-4">每天刷新，完成任务获得额外经验奖励</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {dailyQuests.map(q => {
          const progress = getQuestProgress(q);
          const pct = Math.min(100, (progress / q.target) * 100);
          const completed = pct >= 100;
          const isClaimed = claimed.includes(q.id);
          return (
            <div key={q.id} className={`bg-surface rounded-xl border p-4 transition-all ${completed && !isClaimed ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-white/5'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">每日</span>
                </div>
                <span className="text-gray-500 text-xs">今天</span>
              </div>
              <div className="font-bold mb-1">{q.icon} {q.name}</div>
              <div className="text-sm text-gray-400 mb-3">{q.desc}</div>
              <div className="h-2 bg-surface-light rounded-full mb-1 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>{Math.min(progress, q.target).toFixed(1)} / {q.target} {q.unit}</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-emerald-400 mb-2">🎁 +{q.reward} XP</div>
              {isClaimed ? (
                <button className="w-full py-1.5 bg-surface-light rounded-lg text-xs text-gray-500" disabled>✅ 已领取</button>
              ) : completed ? (
                <button onClick={() => claimQuest(q)} className="w-full py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/30 transition-colors">
                  🎁 领取奖励
                </button>
              ) : (
                <button className="w-full py-1.5 bg-surface-light rounded-lg text-xs text-gray-500" disabled>进行中...</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
