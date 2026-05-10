import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

export default function TeamHub({ userData, refreshUser }) {
  const { addToast } = useApp();
  const [team, setTeam] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('my'); // my | leaderboard | create | join
  const [createName, setCreateName] = useState('');
  const [joinTeamId, setJoinTeamId] = useState('');
  const msgEnd = useRef(null);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const d = await api.getMyTeam(userData.id);
      setTeam(d.team);
    } catch (e) { setTeam(null); }
    try {
      const d = await api.getTeamLeaderboard();
      setLeaderboard(d.leaderboard || []);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { loadTeam(); }, [userData.id]);

  useEffect(() => {
    if (team) {
      const interval = setInterval(loadTeam, 5000);
      return () => clearInterval(interval);
    }
  }, [team?.id]);

  const handleCreate = async () => {
    if (!createName.trim()) { addToast('提示', '请输入队伍名称', 'error'); return; }
    try {
      const d = await api.createTeam(userData.id, createName);
      setTeam(d.team);
      addToast('队伍创建成功！', d.team.name, 'success');
      refreshUser();
    } catch (e) { addToast('创建失败', e.message, 'error'); }
  };

  const handleJoin = async () => {
    if (!joinTeamId.trim()) { addToast('提示', '请输入队伍ID', 'error'); return; }
    try {
      const d = await api.joinTeam(userData.id, joinTeamId);
      setTeam(d.team);
      addToast('加入队伍成功！', d.team.name, 'success');
    } catch (e) { addToast('加入失败', e.message, 'error'); }
  };

  const handleLeave = async () => {
    try {
      await api.leaveTeam(userData.id, team.id);
      setTeam(null);
      addToast('已退出队伍', '', 'info');
    } catch (e) { addToast('退出失败', e.message, 'error'); }
  };

  const handleSendMsg = async () => {
    if (!msgInput.trim() || !team) return;
    try {
      await api.sendTeamMessage(team.id, userData.id, msgInput);
      setMsgInput('');
      loadTeam();
    } catch (e) { addToast('发送失败', e.message, 'error'); }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="font-bold text-lg mb-4">🤝 组队中心</h3>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-4">
        {[
          { key: 'my', label: '我的队伍' },
          { key: 'create', label: '创建队伍' },
          { key: 'join', label: '加入队伍' },
          { key: 'leaderboard', label: '🏆 队伍排行' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* My Team */}
      {tab === 'my' && (
        team ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl border border-white/5 p-5">
              <h4 className="font-bold mb-2">{team.name}</h4>
              <p className="text-xs text-gray-500 mb-3">ID: {team.id?.slice(0, 8)}...</p>
              <div className="h-3 bg-surface-light rounded-full overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, ((team.weeklyProgress || 0) / (team.weeklyGoal || 300)) * 100)}%` }} />
              </div>
              <p className="text-xs text-gray-500 mb-4">
                本周进度：{team.weeklyProgress || 0} / {team.weeklyGoal || 300} 分钟
              </p>
              <div className="space-y-2">
                {(team.members || []).map((m, i) => (
                  <div key={m.id || i} className="flex items-center gap-2 bg-surface-light rounded-lg p-2">
                    <span className="text-lg">{m.avatar || '👤'}</span>
                    <div className="flex-1 text-sm">
                      <span className="font-semibold">{m.username}</span>
                      {m.id === team.leaderId && <span className="text-xs text-amber-400 ml-1">👑队长</span>}
                    </div>
                    <span className="text-xs text-gray-500">{m.weekMinutes || 0}分钟</span>
                  </div>
                ))}
              </div>
              <button onClick={handleLeave} className="mt-3 w-full py-2 bg-red-500/10 text-red-400 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors">
                退出队伍
              </button>
            </div>
            {/* Chat */}
            <div className="bg-surface rounded-2xl border border-white/5 p-5 flex flex-col">
              <h4 className="font-bold mb-3">💬 队伍聊天</h4>
              <div className="flex-1 max-h-64 overflow-y-auto space-y-2 mb-3">
                {(team.messages || []).slice().reverse().map((m, i) => (
                  <div key={m.id || i} className={`text-sm ${m.userId === userData.id ? 'text-right' : ''}`}>
                    <span className="text-xs text-gray-500">{m.username}: </span>
                    <span>{m.content}</span>
                  </div>
                ))}
                <div ref={msgEnd} />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={msgInput} onChange={e => setMsgInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMsg()}
                  placeholder="输入消息..." className="flex-1 bg-surface-light border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-primary focus:outline-none"
                />
                <button onClick={handleSendMsg} className="px-4 bg-primary rounded-lg text-sm font-semibold">发送</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🤝</div>
            <p className="font-semibold mb-1">还没有加入队伍</p>
            <p className="text-sm">创建或加入一个队伍，和队友一起完成每周挑战！</p>
          </div>
        )
      )}

      {/* Create */}
      {tab === 'create' && (
        <div className="bg-surface rounded-2xl border border-white/5 p-5 max-w-sm mx-auto">
          <h4 className="font-bold mb-4">创建新队伍</h4>
          <input
            type="text" value={createName} onChange={e => setCreateName(e.target.value)}
            placeholder="输入队伍名称（2-12字）" maxLength={12}
            className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:border-primary focus:outline-none"
          />
          <button onClick={handleCreate} className="w-full py-3 bg-primary text-white font-bold rounded-xl">
            创建队伍
          </button>
        </div>
      )}

      {/* Join */}
      {tab === 'join' && (
        <div className="bg-surface rounded-2xl border border-white/5 p-5 max-w-sm mx-auto">
          <h4 className="font-bold mb-4">加入队伍</h4>
          <input
            type="text" value={joinTeamId} onChange={e => setJoinTeamId(e.target.value)}
            placeholder="输入队伍ID"
            className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white text-sm mb-3 focus:border-primary focus:outline-none"
          />
          <button onClick={handleJoin} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl">
            加入队伍
          </button>
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="space-y-2">
          {leaderboard.map((t, i) => (
            <div key={t.id} className="bg-surface rounded-xl border border-white/5 p-4 flex items-center gap-3">
              <span className="text-2xl font-black w-8 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
              <div className="flex-1">
                <div className="font-bold">{t.name}</div>
                <div className="text-xs text-gray-500">{t.memberCount}人 · 本周{t.weeklyProgress || 0}分钟</div>
              </div>
              <div className="h-3 w-24 bg-surface-light rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, ((t.weeklyProgress || 0) / 300) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
