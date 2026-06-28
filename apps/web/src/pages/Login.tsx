import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { authApi } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useStore(s => s.setAuth);
  const initSocket = useStore(s => s.initSocket);
  const [mode, setMode] = useState<'account' | 'sms'>('account');
  const [account, setAccount] = useState('alice');
  const [password, setPassword] = useState('123456');
  const [phone, setPhone] = useState('13800000001');
  const [code, setCode] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let res;
      if (mode === 'account') {
        res = await authApi.login({ account, password });
      } else {
        res = await authApi.loginBySms({ phone, code });
      }
      localStorage.setItem('token', res.accessToken);
      localStorage.setItem('user', JSON.stringify(res.user));
      setAuth(res.accessToken, res.user);
      initSocket();
      navigate('/chat', { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-white page-enter">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text tracking-tight">ChatApp</h1>
        <p className="text-text-secondary text-sm mt-1">随时随地，畅快聊天</p>
      </div>

      {/* Mode tabs */}
      <div className="flex w-full mb-6 bg-bg rounded-xl p-1">
        <button
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'account' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}
          onClick={() => setMode('account')}
        >账号登录</button>
        <button
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'sms' ? 'bg-white shadow-sm text-primary' : 'text-text-secondary'}`}
          onClick={() => setMode('sms')}
        >短信验证</button>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="w-full space-y-3">
        {mode === 'account' ? (
          <>
            <div>
              <label className="text-xs text-text-secondary font-medium ml-1">账号</label>
              <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="请输入账号" value={account} onChange={e => setAccount(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium ml-1">密码</label>
              <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" type="password" placeholder="请输入密码" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="text-xs text-text-secondary font-medium ml-1">手机号</label>
              <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="请输入手机号" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium ml-1">验证码</label>
              <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="请输入 6 位验证码" value={code} onChange={e => setCode(e.target.value)} />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-50 text-red-500 text-sm text-center py-2.5 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-base transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98] mt-2"
        >{loading ? '登录中...' : '登录'}</button>
      </form>

      <p className="text-center text-xs text-text-secondary/60 mt-8">
        测试账号：alice / 123456 或 bob / 123456
      </p>
    </div>
  );
}
