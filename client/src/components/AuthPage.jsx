import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const CLASSES = [
  { key: 'warrior', name: '战士', icon: '⚔️', desc: '近战专精，体能王者', bonus: '力量+15% | 耐力+10%' },
  { key: 'archer', name: '射手', icon: '🏹', desc: '敏捷灵活，持久续航', bonus: '敏捷+15% | 耐力+10%' },
  { key: 'mage', name: '法师', icon: '🔮', desc: '爆发力强，精神专注', bonus: '爆发+15% | 精神+10%' },
];

export default function AuthPage() {
  const { login, register, addToast } = useApp();
  const [mode, setMode] = useState('login'); // login | register | create
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      addToast('提示', '请填写用户名和密码');
      return;
    }
    if (mode === 'create' && !selectedClass) {
      addToast('提示', '请选择职业');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await register(username, password);
        addToast('⚔️ 冒险开始！', `欢迎，${CLASSES.find(c=>c.key===selectedClass).name} ${username}！`);
      } else if (mode === 'register') {
        await register(username, password);
        addToast('注册成功！', '欢迎加入燃动Fit，开始你的运动冒险');
      } else {
        await login(username, password);
        addToast('欢迎回来！', `${username}，继续你的冒险吧`);
      }
    } catch (e) {
      addToast('操作失败', e.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏰</div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
            燃动Fit
          </h1>
          <p className="text-gray-400 mt-2">游戏化运动激励平台</p>
        </div>

        {/* Form */}
        <div className="bg-surface rounded-2xl border border-white/5 p-6">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-6">
            {[
              { key: 'login', label: '登录' },
              { key: 'register', label: '注册' },
              { key: 'create', label: '创建角色' },
            ].map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="输入冒险者名字"
                maxLength={12}
                className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码"
                className="w-full bg-surface-light border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            {/* Class selection for create mode */}
            {mode === 'create' && (
              <div>
                <label className="block text-sm text-gray-400 mb-2">选择职业</label>
                <div className="grid grid-cols-3 gap-2">
                  {CLASSES.map(cls => (
                    <button
                      key={cls.key}
                      type="button"
                      onClick={() => setSelectedClass(cls.key)}
                      className={`p-3 rounded-xl text-center transition-all border-2 ${
                        selectedClass === cls.key
                          ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                          : 'border-white/5 bg-surface-light hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">{cls.icon}</div>
                      <div className="text-sm font-bold">{cls.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{cls.desc}</div>
                      <div className="text-xs text-emerald-400 mt-0.5">{cls.bonus}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-primary to-violet-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50"
            >
              {submitting ? '处理中...' : mode === 'login' ? '登录' : mode === 'register' ? '注册' : '创建角色并开始'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
