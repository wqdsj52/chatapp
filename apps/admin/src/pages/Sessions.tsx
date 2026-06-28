import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';

export default function Sessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      setSessions(await adminApi.getSessions(query || undefined));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('删除会话将同时删除其所有消息，确认吗？')) return;
    await adminApi.deleteSession(id);
    fetchSessions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">会话管理</h1>
        <div className="flex gap-2">
          <input className="px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" placeholder="搜索会话" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchSessions()} />
          <button onClick={fetchSessions} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">会话</th>
              <th className="px-4 py-3">类型</th>
              <th className="px-4 py-3">成员</th>
              <th className="px-4 py-3">消息</th>
              <th className="px-4 py-3">最近消息</th>
              <th className="px-4 py-3">创建</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : sessions.map(s => (
              <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{s.name || (s.type === 'single' ? s.members.map((m: any) => m.nickname).join(' & ') : '群聊')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${s.type === 'group' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{s.type === 'group' ? '群聊' : '单聊'}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{s.members.length}</td>
                <td className="px-4 py-3 text-gray-500">{s.messageCount}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[220px] truncate">{s.lastMessage?.content || '-'}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
