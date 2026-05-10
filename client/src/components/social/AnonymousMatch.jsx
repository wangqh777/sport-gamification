import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

const SPORT_TYPES = ['跑步', '骑行', '篮球', '游泳', '羽毛球', '健身'];
const TIME_SLOTS = ['早上(6-9点)', '上午(9-12点)', '下午(14-18点)', '晚上(18-22点)'];
const LOCATIONS = ['操场', '体育馆', '健身房', '湖边跑道', '篮球场', '游泳馆'];

export default function AnonymousMatch({ userData }) {
  const { addToast } = useApp();
  const [step, setStep] = useState('create'); // create | waiting | matched
  const [form, setForm] = useState({ type: '跑步', location: '操场', timePreference: '晚上(18-22点)', genderPreference: 'any' });
  const [match, setMatch] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await api.createMatch({
        userId: userData.id,
        ...form,
      });
      addToast('约跑请求已发布！', '正在寻找匹配...', 'success');
      setStep('waiting');
      // Auto search after 2 seconds
      setTimeout(() => handleSearch(), 2000);
    } catch (e) { addToast('发布失败', e.message, 'error'); }
    setSubmitting(false);
  };

  const handleSearch = async () => {
    try {
      const d = await api.findMatch(userData.id);
      if (d.match) {
        setMatch(d.match);
        setStep('matched');
        addToast('匹配成功！', `找到了${d.match.type}伙伴`, 'success');
      } else if (d.waiting) {
        addToast('暂无匹配', '请稍后再试，系统会持续为你寻找', 'info');
      }
    } catch (e) { addToast('匹配失败', e.message, 'error'); }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h3 className="font-bold text-lg mb-4">🔍 匿名约跑</h3>

      {/* Create */}
      {step === 'create' && (
        <div className="bg-surface rounded-2xl border border-white/5 p-5">
          <p className="text-sm text-gray-400 mb-4">发布约跑请求，系统会为你匹配同校的运动伙伴</p>

          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">运动类型</label>
              <div className="grid grid-cols-3 gap-2">
                {SPORT_TYPES.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`py-2 px-4 rounded-lg text-sm transition-all ${
                      form.type === t ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">地点</label>
              <select
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">时间偏好</label>
              <select
                value={form.timePreference}
                onChange={e => setForm(f => ({ ...f, timePreference: e.target.value }))}
                className="w-full bg-surface-light border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-primary focus:outline-none"
              >
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">性别偏好</label>
              <div className="flex gap-2">
                {[
                  { key: 'any', label: '不限' },
                  { key: 'male', label: '男生' },
                  { key: 'female', label: '女生' },
                ].map(g => (
                  <button key={g.key} onClick={() => setForm(f => ({ ...f, genderPreference: g.key }))}
                    className={`flex-1 py-2 rounded-lg text-sm transition-all ${
                      form.genderPreference === g.key ? 'bg-primary text-white' : 'bg-surface-light text-gray-400 hover:text-white'
                    }`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {submitting ? '发布中...' : '🔍 寻找运动伙伴'}
          </button>
        </div>
      )}

      {/* Waiting */}
      {step === 'waiting' && (
        <div className="bg-surface rounded-2xl border border-white/5 p-5 text-center">
          <div className="text-5xl mb-4 animate-bounce">🔍</div>
          <h4 className="font-bold text-lg mb-2">正在寻找伙伴...</h4>
          <p className="text-sm text-gray-400 mb-4">系统正在为你匹配合适的运动伙伴</p>
          <button onClick={handleSearch} className="px-6 py-2 bg-primary rounded-xl text-sm font-semibold">
            🔄 重新搜索
          </button>
        </div>
      )}

      {/* Matched */}
      {step === 'matched' && match && (
        <div className="bg-surface rounded-2xl border border-emerald-400/30 p-5 achievement-glow">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🎉</div>
            <h4 className="font-bold text-lg text-emerald-400">匹配成功！</h4>
          </div>
          <div className="bg-surface-light rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                {match.avatar || '👤'}
              </span>
              <div>
                <div className="font-bold">{match.username}</div>
                <div className="text-sm text-gray-400">Lv.{match.level} · 运动{typeof match.stats === 'string' ? JSON.parse(match.stats).end : match.stats?.end || 0}分钟</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-surface rounded-lg p-2 text-center">
                <div className="text-gray-500 text-xs">运动类型</div>
                <div className="font-semibold">{match.type}</div>
              </div>
              <div className="bg-surface rounded-lg p-2 text-center">
                <div className="text-gray-500 text-xs">地点</div>
                <div className="font-semibold">{match.location}</div>
              </div>
              <div className="bg-surface rounded-lg p-2 text-center">
                <div className="text-gray-500 text-xs">时间</div>
                <div className="font-semibold">{match.timePreference}</div>
              </div>
              <div className="bg-surface rounded-lg p-2 text-center">
                <div className="text-gray-500 text-xs">匹配时间</div>
                <div className="font-semibold">{new Date(match.createdAt).toLocaleDateString('zh-CN')}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">运动结束后可以互相评价，决定是否添加好友</p>
        </div>
      )}
    </div>
  );
}
