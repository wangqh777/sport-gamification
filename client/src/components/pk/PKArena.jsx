import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

const PK_RANKS = ['青铜', '白银', '黄金', '铂金', '钻石'];

export default function PKArena({ userData, refreshUser }) {
  const { addToast } = useApp();
  const [tab, setTab] = useState('challenge'); // challenge | history
  const [friends, setFriends] = useState([]);
  const [pks, setPKs] = useState([]);
  const [activePK, setActivePK] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState('');
  const [duration, setDuration] = useState(30);
  const [myProgress, setMyProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getFriends(userData.id).then(d => setFriends(d.friends || [])).catch(() => {});
    api.getPKs(userData.id).then(d => setPKs(d.pks || [])).catch(() => {});
    api.getActivePK(userData.id).then(d => {
      setActivePK(d.pk);
      if (d.pk) {
        const prog = d.pk.challengerId === userData.id ? d.pk.challengerProgress : d.pk.challengedProgress;
        setMyProgress(prog);
      }
    }).catch(() => {});
  }, [userData.id]);

  const handleChallenge = async () => {
    if (!selectedFriend) { addToast('提示', '请选择好友', 'error'); return; }
    setSubmitting(true);
    try {
      const d = await api.createPK(userData.id, selectedFriend, parseInt(duration));
      addToast('挑战已发送！', '等待对方接受', 'success');
      api.getPKs(userData.id).then(d => setPKs(d.pks || []));
    } catch (e) { addToast('挑战失败', e.message, 'error'); }
    setSubmitting(false);
  };

  const handleRespond = async (matchId, accept) => {
    try {
      await api.respondPK(matchId, userData.id, accept);
      addToast(accept ? 'PK已接受！' : 'PK已拒绝', '', 'info');
      api.getActivePK(userData.id).then(d => setActivePK(d.pk));
      api.getPKs(userData.id).then(d => setPKs(d.pks || []));
      refreshUser();
    } catch (e) { addToast('操作失败', e.message, 'error'); }
  };

  const handleUpdateProgress = async () => {
    if (!activePK) return;
    const newProgress = Math.min(activePK.duration, myProgress + 5);
    setMyProgress(newProgress);
    try {
      const d = await api.updatePKProgress(activePK.id, userData.id, newProgress);
      if (d.match?.status === 'completed') {
        addToast('PK结束！', d.match.winnerId === userData.id ? '你赢了！🏆' : '继续加油！💪', 'success');
        setActivePK(null);
        refreshUser();
        api.getPKs(userData.id).then(d => setPKs(d.pks || []));
      }
    } catch (e) { addToast('更新失败', e.message, 'error'); }
  };

  const getOpponentProgress = () => {
    if (!activePK) return 0;
    return activePK.challengerId === userData.id ? activePK.challengedProgress : activePK.challengerProgress;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="font-bold text-lg mb-4">⚔️ PK竞技场</h3>

      <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-4">
        {[
          { key: 'challenge', label: '发起挑战' },
          { key: 'active', label: '进行中' },
          { key: 'history', label: 'PK记录' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Challenge Tab */}
      {tab === 'challenge' && (
        <div className="bg-surface rounded-2xl border border-white/5 p-5">
          <h4 className="font-bold mb-4">向好友发起PK挑战</h4>
          <div className="mb-3">
            <label className="block text-sm text-gray-400 mb-1">选择对手</label>
            <select
              value={selectedFriend}
              onChange={e => setSelectedFriend(e.target.value)}
              className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
            >
              <option value="">-- 选择好友 --</option>
              {friends.map(f => (
                <option key={f.id} value={f.id}>{f.username} (Lv.{f.level})</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-1">PK时长</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                    duration === d ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                  }`}
                >
                  {d}分钟
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            当前PK段位：<span className="font-bold text-amber-400">{userData?.pkRank || '青铜'}</span> · PK积分：{userData?.pkScore || 1000}
          </p>
          <button
            onClick={handleChallenge}
            disabled={submitting || !selectedFriend}
            className="w-full py-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {submitting ? '发送中...' : '⚔️ 发起挑战'}
          </button>
        </div>
      )}

      {/* Active PK Tab */}
      {tab === 'active' && (
        activePK ? (
          <div className="bg-surface rounded-2xl border border-2 border-rose-400/30 p-5">
            <h4 className="font-bold mb-4">⚡ 正在PK中...</h4>
            {/* Progress bars */}
            <div className="space-y-4 mb-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>👤 你</span>
                  <span>{myProgress} / {activePK.duration} 分钟</span>
                </div>
                <div className="h-4 bg-surface-light rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(myProgress / activePK.duration) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>👤 对手</span>
                  <span>{getOpponentProgress()} / {activePK.duration} 分钟</span>
                </div>
                <div className="h-4 bg-surface-light rounded-full overflow-hidden">
                  <div className="h-full bg-rose-400 rounded-full transition-all" style={{ width: `${(getOpponentProgress() / activePK.duration) * 100}%` }} />
                </div>
              </div>
            </div>
            <button
              onClick={handleUpdateProgress}
              className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
            >
              🏃 +5 分钟（模拟运动进度）
            </button>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">😴</div>
            <p>没有进行中的PK</p>
            <p className="text-sm mt-1">发起挑战或等待对手接受你的挑战</p>

            {/* Pending challenges */}
            {pks.filter(p => p.status === 'pending' && p.challengedId === userData.id).map(p => (
              <div key={p.id} className="mt-4 bg-surface rounded-xl border border-amber-400/20 p-4 max-w-sm mx-auto">
                <p className="text-sm mb-2">有人向你发起PK挑战！</p>
                <p className="text-xs text-gray-500 mb-3">时长：{p.duration}分钟</p>
                <div className="flex gap-2">
                  <button onClick={() => handleRespond(p.id, true)} className="flex-1 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                    接受
                  </button>
                  <button onClick={() => handleRespond(p.id, false)} className="flex-1 py-2 bg-surface-light text-gray-400 rounded-lg text-sm font-semibold">
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-2">
          {pks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">还没有PK记录</div>
          ) : (
            pks.map(p => (
              <div key={p.id} className="bg-surface rounded-xl border border-white/5 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm">
                      {p.challengerId === userData.id ? '你挑战' : '你被挑战'} · {p.duration}分钟
                    </span>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      p.status === 'completed' ? 'bg-emerald-400/20 text-emerald-400' :
                      p.status === 'active' ? 'bg-blue-400/20 text-blue-400' :
                      p.status === 'declined' ? 'bg-gray-400/20 text-gray-400' :
                      'bg-amber-400/20 text-amber-400'
                    }`}>
                      {p.status === 'completed' ? '已结束' : p.status === 'active' ? '进行中' : p.status === 'declined' ? '已拒绝' : '等待中'}
                    </span>
                  </div>
                  <div className="text-sm">
                    结果：
                    {p.status === 'completed' ? (
                      <span className={`font-bold ${p.winnerId === userData.id ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.winnerId === userData.id ? '胜利 🏆' : '失败 💪'}
                      </span>
                    ) : <span className="text-gray-500">--</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
