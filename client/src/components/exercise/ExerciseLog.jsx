import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

export default function ExerciseLog({ userData, refreshUser }) {
  const { addToast, setShowLevelUp, setShowAchievement } = useApp();
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState('medium');
  const [note, setNote] = useState('');
  const [history, setHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getExerciseTypes().then(d => {
      setTypes(d.types);
      if (d.types.length > 0) setSelectedType(d.types[0].id);
    }).catch(() => {});
    loadHistory();
  }, [userData.id]);

  const loadHistory = () => {
    api.getHistory(userData.id, 30).then(d => setHistory(d.activities || [])).catch(() => {});
  };

  const calcRewards = () => {
    const exType = types.find(t => t.id === selectedType);
    if (!exType) return null;
    const mult = { low: 0.7, medium: 1.0, high: 1.5 }[intensity] || 1;
    return {
      xp: Math.round(exType.baseXP * duration * mult),
      coins: Math.round(exType.baseXP * duration * mult * 0.6),
      calories: Math.round(exType.calPerMin * duration * mult),
      statName: exType.statName,
      statGain: Math.round(duration * mult),
    };
  };

  const rewards = calcRewards();

  const handleSubmit = async () => {
    if (!selectedType) { addToast('提示', '请选择运动类型', 'error'); return; }
    if (!duration || duration < 1) { addToast('提示', '请输入运动时长', 'error'); return; }
    setSubmitting(true);
    try {
      const result = await api.logActivity({
        userId: userData.id, type: selectedType,
        duration: parseInt(duration), intensity, note: note.trim(),
      });
      const { levelResult, newAchievements } = result;

      const exType = types.find(t => t.id === selectedType);
      addToast('✅ 训练完成！',
        `${exType?.name || ''} ${duration}分钟 · +${rewards?.xp}XP · ${rewards?.calories}kcal`, 'success');

      if (levelResult?.leveledUp) {
        setShowLevelUp({ oldLevel: levelResult.level - 1, newLevel: levelResult.level });
      }
      if (newAchievements?.length > 0) {
        setShowAchievement(newAchievements);
      }

      refreshUser();
      loadHistory();
      setDuration(30);
      setIntensity('medium');
      setNote('');
    } catch (e) {
      addToast('记录失败', e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Exercise Log Form */}
      <div className="bg-surface rounded-2xl border border-white/5 p-5">
        <h3 className="font-bold mb-2">🏃 记录训练</h3>
        <p className="text-sm text-gray-400 mb-4">选择运动类型并填写详情，获得经验与金币</p>

        {/* Type selector */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedType(t.id)}
              className={`p-3 rounded-xl text-center transition-all border-2 ${
                selectedType === t.id
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : 'border-white/5 bg-surface-light hover:border-white/20'
              }`}
            >
              <div className="text-xl mb-1">{t.icon}</div>
              <div className="text-xs font-semibold">{t.name}</div>
              <div className="text-xs text-gray-500">{t.baseXP}XP/分</div>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">时长（分钟）</label>
            <input
              type="number" value={duration} onChange={e => setDuration(e.target.value)}
              min={1} max={300}
              className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">强度</label>
            <select
              value={intensity} onChange={e => setIntensity(e.target.value)}
              className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
            >
              <option value="low">🟢 低强度</option>
              <option value="medium">🟡 中强度</option>
              <option value="high">🔴 高强度</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">备注（可选）</label>
            <input
              type="text" value={note} onChange={e => setNote(e.target.value)}
              placeholder="例如：操场5圈"
              className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Reward Preview */}
        {rewards && (
          <div className="bg-surface-light rounded-xl p-4 grid grid-cols-4 gap-2 mb-4 text-center">
            <div><div className="text-sm font-bold text-violet-400">+{rewards.xp}</div><div className="text-xs text-gray-500">经验值</div></div>
            <div><div className="text-sm font-bold text-amber-400">+{rewards.coins}</div><div className="text-xs text-gray-500">金币</div></div>
            <div><div className="text-sm font-bold text-rose-400">{rewards.calories}</div><div className="text-xs text-gray-500">卡路里</div></div>
            <div><div className="text-sm font-bold text-emerald-400">{rewards.statName}+{rewards.statGain}</div><div className="text-xs text-gray-500">属性</div></div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50"
        >
          {submitting ? '记录中...' : '✅ 完成训练'}
        </button>
      </div>

      {/* History */}
      <div className="bg-surface rounded-2xl border border-white/5 p-5">
        <h3 className="font-bold mb-3">📜 训练历史</h3>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-3xl mb-2">📭</div>
            <p>还没有训练记录</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {history.slice(0, 30).map((h, i) => {
              const t = types.find(tt => tt.id === h.type);
              const d = new Date(h.createdAt);
              return (
                <div key={h.id || i} className="flex items-center gap-3 bg-surface-light rounded-xl p-3">
                  <div className="text-2xl w-10 text-center">{t?.icon || '🏃'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{t?.name || h.type} · {h.duration}分钟</div>
                    <div className="text-xs text-gray-500">
                      {d.toLocaleDateString('zh-CN', { month:'short', day:'numeric' })} · {h.calories}kcal
                      {h.note ? ` · ${h.note}` : ''}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary">+{h.expEarned}XP</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
