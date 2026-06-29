import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Friends() {
  const navigate = useNavigate();
  const { friends, fetchFriends, removeFriend } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchFriends().finally(() => setLoading(false)); }, []);

  const startChat = async (userId: string) => {
    try {
      const { chatApi } = await import('../lib/api');
      const session = await chatApi.createSingleSession(userId);
      navigate('/chat/' + session.id);
    } catch {}
  };

  return (
    <div className="h-full flex flex-col bg-bg">
      <div className="flex items-center justify-between px-5 pt-14 pb-3 bg-white">
        <h1 className="text-xl font-bold">好友</h1>
        <button onClick={() => navigate('/search')} className="text-primary text-sm">添加</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-text-secondary">加载中...</div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-text-secondary">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-40"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <p>暂无好友</p>
            <p className="text-xs mt-1">搜索用户添加好友</p>
          </div>
        ) : friends.map(f => (
          <div key={f.id} className="flex items-center bg-white border-b border-border px-5 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 overflow-hidden cursor-pointer" onClick={() => navigate('/user/' + f.id)}>
              {f.avatarUrl ? <img src={f.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" /> : <span className="text-primary font-bold">{(f.nickname || f.account)[0]}</span>}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/user/' + f.id)}>
              <div className="text-sm font-medium truncate">{f.nickname || f.account}</div>
              {f.userCode && <div className="text-xs text-primary">#{f.userCode}</div>}
            </div>
            <button onClick={() => startChat(f.id)} className="p-2 text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button onClick={() => { if (confirm('确定删除好友？')) removeFriend(f.id); }} className="p-2 text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
