import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) { setError('请输入手机号'); return; }
    if (!account.trim()) { setError('请输入账号'); return; }
    if (!password.trim()) { setError('请输入密码'); return; }
    if (password.length < 6) { setError('密码至少6位'); return; }
    if (password !== confirmPassword) { setError('两次密码不一致'); return; }

    setLoading(true);
    try {
      await authApi.register({ phone, account, password, nickname: nickname || account });
      navigate('/login', { replace: true });
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-8 bg-white page-enter">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text">创建账号</h1>
      </div>

      <form onSubmit={handleRegister} className="w-full space-y-3">
        <div>
          <label className="text-xs text-text-secondary font-medium ml-1">手机号</label>
          <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="请输入手机号" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-secondary font-medium ml-1">账号</label>
          <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="设置登录账号" value={account} onChange={e => setAccount(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-secondary font-medium ml-1">昵称</label>
          <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" placeholder="给自己取个名字（可选）" value={nickname} onChange={e => setNickname(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-secondary font-medium ml-1">密码</label>
          <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" type="password" placeholder="设置密码（至少6位）" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-text-secondary font-medium ml-1">确认密码</label>
          <input className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition" type="password" placeholder="再次输入密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm text-center py-2.5 rounded-xl">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-base transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98] mt-2"
        >{loading ? '注册中..' : '注册'}</button>
      </form>

      <button onClick={() => navigate('/login')} className="mt-4 text-sm text-primary">
        已有账号？去登录
      </button>
    </div>
  );
}
