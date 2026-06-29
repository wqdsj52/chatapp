import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi, chatApi, friendApi } from '../lib/api';
import { useStore } from '../store/useStore';

export default function Search() {
  const navigate = useNavigate();
  const me = useStore(s => s.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    try {
      const users = await userApi.search(q);
      setResults(users.filter((u: any) => u.id !== me?.id));
    } catch { setResults([]); }
    finally { setLoading(false); }
  };

  const handleStartChat = async (userId: string) => {
    try {
      const session = await chatApi.createSingleSession(userId);
      navigate('/chat/' + session.id);
    } catch {}
  };

  const handleAddFriend = async (userId: string) => {
    try {
      await friendApi.add(userId);
      setRequestedIds(prev => new Set(prev).add(userId));
    } catch (err: any) {
      alert(err.message || '发送失败');
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      <div className="bg-white px-4 pt-12 pb-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <input
          className="flex-1 px-4 py-2.5 rounded-xl bg-bg border-none outline-none text-sm"
          placeholder="搜索用户昵称或代号"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} className="text-primary text-sm font-medium">搜索</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="flex items-center justify-center h-40 text-text-secondary">搜索中...</div>}
        {!loading && searched && results.length === 0 && (
          <div className="flex items-center justify-center h-40 text-text-secondary">未找到用户</div>
        )}
        {!loading && results.map(u => (
          <div key={u.id} className="flex items-center bg-white border-b border-border px-5 py-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 overflow-hidden cursor-pointer" onClick={() => navigate('/user/' + u.id)}>
              {u.avatarUrl ? <img src={u.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="" /> : <span className="text-primary font-bold">{(u.nickname || u.account)[0]}</span>}
            </div>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate('/user/' + u.id)}>
              <div className="text-sm font-medium truncate">{u.nickname || u.account}</div>
              {u.userCode && <div className="text-xs text-primary">#{u.userCode}</div>}
            </div>
            <button onClick={() => handleStartChat(u.id)} className="p-2 text-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button onClick={() => handleAddFriend(u.id)} className={'px-3 py-1.5 rounded-lg text-xs font-medium ' + (requestedIds.has(u.id) ? 'bg-gray-100 text-text-secondary' : 'bg-primary/10 text-primary')}>
              {requestedIds.has(u.id) ? '已申请' : '添加'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
