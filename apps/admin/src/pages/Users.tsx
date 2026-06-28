import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminApi.getUsers(query || undefined));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除该用户？')) return;
    await adminApi.deleteUser(id);
    fetchUsers();
  };

  const handleViewDetail = async (id: string) => {
    setSelectedUser(await adminApi.getUserDetail(id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <div className="flex gap-2">
          <input className="px-4 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-500" placeholder="搜索用户" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers()} />
          <button onClick={fetchUsers} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">搜索</button>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-4 py-3">用户</th>
              <th className="px-4 py-3">账号</th>
              <th className="px-4 py-3">手机</th>
              <th className="px-4 py-3">会话</th>
              <th className="px-4 py-3">消息</th>
              <th className="px-4 py-3">注册</th>
              <th className="px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">加载中...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold">{(u.nickname || u.account)[0]}</div>
                    <span className="font-medium">{u.nickname}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.account}</td>
                <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                <td className="px-4 py-3 text-gray-500">{u.sessionCount}</td>
                <td className="px-4 py-3 text-gray-500">{u.messageCount}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => handleViewDetail(u.id)} className="text-blue-600 hover:underline text-xs">详情</button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">用户详情</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-4"><span className="text-gray-400 w-24">昵称</span><span className="font-medium">{selectedUser.nickname}</span></div>
              <div className="flex gap-4"><span className="text-gray-400 w-24">账号</span><span>{selectedUser.account}</span></div>
              <div className="flex gap-4"><span className="text-gray-400 w-24">手机</span><span>{selectedUser.phone}</span></div>
              <div className="flex gap-4"><span className="text-gray-400 w-24">会话</span><span>{selectedUser.sessions?.length || 0}</span></div>
              <div className="flex gap-4"><span className="text-gray-400 w-24">通知</span><span>{selectedUser.notificationCount}（未读 {selectedUser.unreadNotifications}）</span></div>
              <div className="flex gap-4"><span className="text-gray-400 w-24">注册</span><span>{new Date(selectedUser.createdAt).toLocaleString()}</span></div>
              {selectedUser.sessions?.length > 0 && (
                <div>
                  <p className="text-gray-400 mb-2">参与会话：</p>
                  {selectedUser.sessions.map((s: any) => (
                    <div key={s.id} className="bg-gray-50 rounded-lg px-3 py-2 mb-1 text-xs">
                      <span className="font-medium">{s.name || (s.type === 'single' ? '单聊' : '群聊')}</span>
                      <span className="text-gray-400 ml-2">{s.memberCount} 人 / {s.messageCount} 条消息</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
