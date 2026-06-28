import { useEffect, useState } from 'react';
import { adminApi } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="text-red-500 text-sm">{error}</div>;
  if (!stats) return <div className="text-gray-400 text-sm">加载中...</div>;

  const cards = [
    { label: '用户总数', value: stats.totalUsers, color: 'bg-blue-500' },
    { label: '会话总数', value: stats.totalSessions, color: 'bg-green-500' },
    { label: '消息总数', value: stats.totalMessages, color: 'bg-purple-500' },
    { label: '群聊数量', value: stats.groupSessions, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">数据概览</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{c.label}</span>
              <span className={`w-2 h-2 rounded-full ${c.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">近 7 天消息走势</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.dailyMessages}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">最新注册用户</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2">昵称</th>
              <th className="pb-2">账号</th>
              <th className="pb-2">手机</th>
              <th className="pb-2">注册时间</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentUsers.map((u: any) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="py-2 font-medium">{u.nickname}</td>
                <td className="py-2 text-gray-500">{u.account}</td>
                <td className="py-2 text-gray-500">{u.phone}</td>
                <td className="py-2 text-gray-400">{new Date(u.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
