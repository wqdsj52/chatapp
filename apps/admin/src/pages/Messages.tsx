import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';

export default function Messages() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getSessions().then(setSessions).catch(e => setError(e.message));
  }, []);

  const fetchMessages = async () => {
    if (!selectedSession) return;
    setLoading(true);
    setError('');
    try {
      setMessages(await adminApi.getMessages(selectedSession, query || undefined));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, [selectedSession]);

  const handleDelete = async (msgId: string) => {
    if (!window.confirm('确认删除该消息？')) return;
    await adminApi.deleteMessage(selectedSession, msgId);
    fetchMessages();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">消息审计</h1>
      <div className="flex gap-3">
        <select className="px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500 bg-white" value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
          <option value="">请选择会话</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>
              {s.name || (s.type === 'single' ? s.members.map((m: any) => m.nickname).join(' & ') : '群聊')} ({s.messageCount} 条)
            </option>
          ))}
        </select>
        <input className="px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" placeholder="搜索内容" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchMessages()} />
        <button onClick={fetchMessages} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {selectedSession ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">发送者</th>
                <th className="px-4 py-3">内容</th>
                <th className="px-4 py-3">类型</th>
                <th className="px-4 py-3">时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
              ) : messages.map(m => (
                <tr key={m.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">{(m.sender?.nickname || '?')[0]}</div>
                      <span className="font-medium text-xs">{m.sender?.nickname || '未知用户'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[320px] truncate">{m.content}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">{m.type}</span></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(m.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(m.id)} className="text-red-500 hover:underline text-xs">删除</button></td>
                </tr>
              ))}
              {!loading && messages.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">暂无消息</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">请先选择会话</div>
      )}
    </div>
  );
}
