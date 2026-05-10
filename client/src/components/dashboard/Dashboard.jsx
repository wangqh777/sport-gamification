import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.25, lvl - 1)); }
function getRank(sp) {
  if (sp >= 11000) return '王者';
  if (sp >= 9000) return '宗师';
  if (sp >= 7500) return '大师';
  if (sp >= 4800) return '钻石';
  if (sp >= 2800) return '铂金';
  if (sp >= 1400) return '黄金';
  if (sp >= 600) return '白银';
  return '青铜';
}
const STAT_CONFIG = [
  { key:'str', name:'力量', color:'#ff5e7a' },
  { key:'end', name:'耐力', color:'#00d4aa' },
  { key:'agi', name:'敏捷', color:'#f59e0b' },
  { key:'flex', name:'柔韧', color:'#4ecdc4' },
  { key:'pow', name:'爆发', color:'#7c6ff7' },
  { key:'spi', name:'精神', color:'#a78bfa' },
];
const CLASS_ICONS = { warrior:'⚔️', archer:'🏹', mage:'🔮', default:'⚔️' };
const CLASS_NAMES = { warrior:'战士', archer:'射手', mage:'法师' };

export default function Dashboard({ userData, refreshUser }) {
  const { setActiveTab } = { setActiveTab: () => {} };
  const { addToast, setShowLevelUp } = useApp();
  const [stats, setStats] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const statsObj = typeof userData?.stats === 'string' ? JSON.parse(userData.stats) : (userData?.stats || {});

  useEffect(() => {
    api.getStats(userData.id, 'week').then(d => {
      setStats(d.stats);
    }).catch(() => {});
    // Generate week chart data
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        name: ['日','一','二','三','四','五','六'][d.getDay()],
        minutes: 0,
      });
    }
    // Fill from history
    api.getHistory(userData.id, 200).then(d => {
      if (!d.activities) return;
      d.activities.forEach(a => {
        const date = a.createdAt?.slice(0, 10);
        const day = days.find(dd => {
          const dd2 = new Date();
          dd2.setDate(dd2.getDate() - (6 - days.indexOf(dd)));
          return dd2.toISOString().slice(0, 10) === date;
        });
        if (day) day.minutes += a.duration;
      });
      setWeekData(days);
    }).catch(() => {});
  }, [userData.id]);

  const xpNeeded = xpForLevel(userData.level);
  const xpPct = Math.min(100, ((userData.xp || 0) / xpNeeded) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Character Card */}
      <div className="bg-surface rounded-2xl border border-white/5 p-5">
        <h3 className="font-bold mb-4">🎮 角色面板</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-3xl flex-shrink-0">
            {CLASS_ICONS[userData?.class] || CLASS_ICONS.default}
          </div>
          <div>
            <div className="font-bold text-lg">{userData?.username}</div>
            <div className="text-sm text-gray-400">
              {CLASS_NAMES[userData?.class] || '冒险者'} · {userData?.title || '初级冒险者'}
            </div>
            <div className="text-xs text-primary mt-0.5">Lv.{userData?.level} · {getRank(userData?.seasonPoints || 0)}段位</div>
          </div>
        </div>
        {/* Stats */}
        <div className="space-y-2">
          {STAT_CONFIG.map(s => {
            const val = statsObj[s.key] || 10;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-10">{s.name}</span>
                <div className="flex-1 h-2 bg-surface-light rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, val)}%`, backgroundColor: s.color }} />
                </div>
                <span className="text-xs font-bold w-6 text-right">{val}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP & Progress */}
      <div className="bg-surface rounded-2xl border border-white/5 p-5">
        <h3 className="font-bold mb-4">📊 等级进度</h3>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Lv.{userData?.level}</span>
            <span>Lv.{userData?.level + 1}</span>
          </div>
          <div className="h-3 bg-surface-light rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">{userData?.xp || 0} / {xpNeeded} XP</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-primary">{userData?.totalExercises || 0}</div>
            <div className="text-xs text-gray-500">训练次数</div>
          </div>
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-amber-400">{userData?.totalMinutes || 0}</div>
            <div className="text-xs text-gray-500">运动分钟</div>
          </div>
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-rose-400">🔥{userData?.streak || 0}</div>
            <div className="text-xs text-gray-500">连续天数</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-emerald-400">{userData?.coins || 0}</div>
            <div className="text-xs text-gray-500">金币</div>
          </div>
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-violet-400">{userData?.pkScore || 1000}</div>
            <div className="text-xs text-gray-500">PK积分</div>
          </div>
          <div className="text-center bg-surface-light rounded-xl p-3">
            <div className="text-xl font-bold text-amber-400">{userData?.seasonPoints || 0}</div>
            <div className="text-xs text-gray-500">赛季分</div>
          </div>
        </div>
      </div>

      {/* Week Chart */}
      <div className="bg-surface rounded-2xl border border-white/5 p-5 md:col-span-2">
        <h3 className="font-bold mb-4">📈 本周运动（分钟）</h3>
        {weekData.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weekData}>
              <XAxis dataKey="name" tick={{ fill: '#9090b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9090b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#151530', border: '1px solid #2d2d5a', borderRadius: '12px' }} />
              <Bar dataKey="minutes" fill="#7c6ff7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8 text-gray-500">记录运动后这里会显示本周数据</div>
        )}
      </div>
    </div>
  );
}
