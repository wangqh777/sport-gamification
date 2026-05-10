import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

export default function SocialHub({ userData, refreshUser }) {
  const { addToast } = useApp();
  const [tab, setTab] = useState('feed'); // feed | friends | search
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tab === 'feed') loadFeed();
    if (tab === 'friends') loadFriends();
  }, [tab, userData.id]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      const d = await api.getFeed(userData.id);
      setFeed(d.posts || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadFriends = async () => {
    setLoading(true);
    try {
      const d = await api.getFriends(userData.id);
      setFriends(d.friends || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    try {
      const d = await api.searchUsers(searchKeyword, userData.id);
      setSearchResults(d.users || []);
    } catch (e) { addToast('搜索失败', e.message, 'error'); }
  };

  const handleAddFriend = async (friendId) => {
    try {
      await api.addFriend(userData.id, friendId);
      addToast('好友添加成功！', '', 'success');
      loadFriends();
    } catch (e) { addToast('添加失败', e.message, 'error'); }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await api.removeFriend(userData.id, friendId);
      addToast('已删除好友', '', 'info');
      loadFriends();
    } catch (e) { addToast('删除失败', e.message, 'error'); }
  };

  const handleLike = async (postId) => {
    try {
      const d = await api.toggleLike(postId, userData.id);
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, likes: d.likes } : p));
    } catch (e) { console.error(e); }
  };

  const handleComment = async (postId, content) => {
    if (!content?.trim()) return;
    try {
      const d = await api.addComment(postId, userData.id, content);
      setFeed(prev => prev.map(p => p.id === postId ? { ...p, comments: d.comments } : p));
    } catch (e) { addToast('评论失败', e.message, 'error'); }
  };

  const renderTabs = () => (
    <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-4">
      {[
        { key: 'feed', label: '📱 动态' },
        { key: 'friends', label: '👥 好友' },
        { key: 'search', label: '🔍 发现' },
      ].map(t => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === t.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <h3 className="font-bold text-lg mb-4">👥 社交中心</h3>
      {renderTabs()}

      {/* Feed Tab */}
      {tab === 'feed' && (
        <div className="space-y-3">
          {feed.length === 0 ? (
            <div className="text-center py-8 text-gray-500">添加好友后这里会显示好友动态</div>
          ) : (
            feed.map(post => (
              <div key={post.id} className="bg-surface rounded-xl border border-white/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    {post.avatar || '👤'}
                  </span>
                  <div>
                    <span className="font-semibold text-sm">{post.username}</span>
                    <span className="text-xs text-gray-500 ml-2">Lv.{post.level}</span>
                  </div>
                </div>
                <p className="text-sm mb-3">{post.content}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <button onClick={() => handleLike(post.id)} className={`hover:text-rose-400 transition-colors ${post.likes?.includes(userData.id) ? 'text-rose-400' : ''}`}>
                    ❤️ {post.likes?.length || 0}
                  </button>
                  <span>💬 {post.comments?.length || 0}</span>
                  <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
                {/* Comments */}
                {post.comments?.length > 0 && (
                  <div className="mt-2 space-y-1 border-t border-white/5 pt-2">
                    {post.comments.slice(-3).map((c, i) => (
                      <div key={c.id || i} className="text-xs text-gray-400">{c.content}</div>
                    ))}
                  </div>
                )}
                {/* Quick comment */}
                <input
                  type="text"
                  placeholder="写评论..."
                  onKeyDown={e => {
                    if (e.key === 'Enter') { handleComment(post.id, e.target.value); e.target.value = ''; }
                  }}
                  className="w-full mt-2 bg-surface-light border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-primary focus:outline-none"
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Friends Tab */}
      {tab === 'friends' && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">还没有好友，去「发现」里添加吧</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friends.map(f => (
                <div key={f.id} className="bg-surface rounded-xl border border-white/5 p-3 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                    {f.avatar || '👤'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm">{f.username}</div>
                    <div className="text-xs text-gray-500">Lv.{f.level} · {f.title} · 🔥{f.streak}天</div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(f.id)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tab */}
      {tab === 'search' && (
        <div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="搜索用户名..."
              className="flex-1 bg-surface-light border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-primary focus:outline-none"
            />
            <button onClick={handleSearch} className="px-4 bg-primary rounded-xl text-sm font-semibold hover:bg-primary/80 transition-colors">
              搜索
            </button>
          </div>
          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u.id} className="bg-surface rounded-xl border border-white/5 p-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                  {u.avatar || '👤'}
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{u.username}</div>
                  <div className="text-xs text-gray-500">Lv.{u.level} · {u.title} · {u.totalMinutes || 0}分钟运动</div>
                </div>
                <button
                  onClick={() => handleAddFriend(u.id)}
                  className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg font-semibold hover:bg-emerald-500/30 transition-colors"
                >
                  + 添加
                </button>
              </div>
            ))}
            {searchKeyword && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500">没有找到匹配的用户</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
