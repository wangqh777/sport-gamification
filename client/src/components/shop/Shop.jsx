import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import { api } from '../../api';

const RARITY_COLORS = {
  common: 'text-gray-400 border-gray-400/20',
  rare: 'text-blue-400 border-blue-400/20',
  epic: 'text-violet-400 border-violet-400/20',
};

export default function Shop({ userData, refreshUser }) {
  const { addToast } = useApp();
  const [tab, setTab] = useState('shop'); // shop | inventory
  const [shopItems, setShopItems] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userData.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shop, inv] = await Promise.all([
        api.getShopItems(),
        api.getMyItems(userData.id),
      ]);
      setShopItems(shop.items || []);
      setMyItems(inv.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleBuy = async (itemId) => {
    try {
      const d = await api.buyItem(userData.id, itemId);
      addToast('购买成功！', d.item?.name, 'success');
      refreshUser();
      loadData();
    } catch (e) { addToast('购买失败', e.message, 'error'); }
  };

  const handleEquip = async (userItemId) => {
    try {
      await api.equipItem(userData.id, userItemId);
      addToast('装备成功！', '', 'success');
      refreshUser();
      loadData();
    } catch (e) { addToast('装备失败', e.message, 'error'); }
  };

  const handleUse = async (userItemId) => {
    try {
      await api.useItem(userData.id, userItemId);
      addToast('使用成功！', '', 'success');
      loadData();
    } catch (e) { addToast('使用失败', e.message, 'error'); }
  };

  if (loading) return <div className="text-center py-8 text-gray-500">加载中...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">🛒 商店</h3>
        <span className="text-sm font-bold text-amber-400">🪙 {userData?.coins || 0} 金币</span>
      </div>

      <div className="flex gap-1 bg-surface-light rounded-xl p-1 mb-4">
        {[
          { key: 'shop', label: '🛒 商城' },
          { key: 'inventory', label: '🎒 背包' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {shopItems.map(item => {
            const canAfford = (userData?.coins || 0) >= item.price;
            const alreadyOwned = myItems.some(i => i.itemId === item.id);
            return (
              <div key={item.id} className={`bg-surface rounded-xl border p-4 transition-all ${RARITY_COLORS[item.rarity] || ''}`}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-bold text-sm mb-1">{item.name}</div>
                <div className="text-xs text-gray-500 mb-2">{item.description}</div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 bg-surface-light rounded-full text-gray-400">{item.rarity}</span>
                  <span className={`text-sm font-bold ${canAfford ? 'text-amber-400' : 'text-gray-600'}`}>🪙 {item.price}</span>
                </div>
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={!canAfford || (alreadyOwned && item.type !== 'consumable')}
                  className="w-full py-1.5 rounded-lg text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed bg-primary text-white hover:bg-primary/80 transition-colors"
                >
                  {alreadyOwned && item.type !== 'consumable' ? '已拥有' : canAfford ? '购买' : '金币不足'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'inventory' && (
        <div>
          {myItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🎒</div>
              <p>背包空空如也</p>
              <p className="text-sm mt-1">去商城购买道具吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {myItems.map(item => (
                <div key={item.id} className="bg-surface rounded-xl border border-white/5 p-4">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <div className="font-bold text-sm mb-1">{item.name}</div>
                  <div className="text-xs text-gray-500 mb-3">{item.type === 'consumable' ? '消耗品' : item.type === 'avatar_frame' ? '头像框' : '称号'}</div>
                  <div className="flex gap-2">
                    {item.type !== 'consumable' && (
                      <button
                        onClick={() => handleEquip(item.id)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          item.equipped ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary hover:bg-primary/30'
                        }`}
                      >
                        {item.equipped ? '已装备' : '装备'}
                      </button>
                    )}
                    {item.type === 'consumable' && (
                      <button
                        onClick={() => handleUse(item.id)}
                        className="flex-1 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-semibold hover:bg-emerald-500/30 transition-colors"
                      >
                        使用
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
