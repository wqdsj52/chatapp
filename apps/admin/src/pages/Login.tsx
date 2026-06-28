import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/useAdmin';
import { authApi } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAdmin(s => s.setAuth);
  const [account, setAccount] = useState('alice');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ account, password });
      setAuth(res.accessToken);
      const parsed = useAdmin.getState().user;
      if (parsed?.role !== 'admin') throw new Error('当前账号没有管理员权限');
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-2xl font-bold">A</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">管理后台登录</h1>
          <p className="text-sm text-gray-400 mt-1">仅管理员账号可登录</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm" placeholder="账号" value={account} onChange={e => setAccount(e.target.value)} />
          <input className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50">{loading ? '登录中...' : '立即登录'}</button>
        </form>
        <p className="text-center text-xs text-gray-300 mt-6">示例账号：admin alice / 123456</p>
      </div>
    </div>
  );
}
