import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { userApi } from '../lib/api';

export default function Profile() {
  const user = useStore(s => s.user);
  const setUser = useStore(s => s.setUser);
  const logout = useStore(s => s.logout);
  const uploadAvatar = useStore(s => s.uploadAvatar);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({ nickname });
      setUser(updated);
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try { await uploadAvatar(file); } catch {}
    finally { setUploading(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { label: '通知设置', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', path: '/notifications' },
    { label: '好友列表', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', path: '/friends' },
    { label: '账号安全', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', path: '' },
    { label: '意见反馈', icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', path: '' },
  ];

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      <div className="bg-white px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-text tracking-tight mb-5">我的</h1>
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20 overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                (user?.nickname || 'U')[0]
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            {uploading && <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center"><span className="text-white text-xs">上传中</span></div>}
          </label>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input className="flex-1 px-3 py-2 rounded-lg bg-bg text-sm outline-none focus:ring-2 focus:ring-primary/20" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="请输入昵称" />
                <button onClick={handleSave} disabled={saving} className="text-xs bg-primary text-white px-3 py-2 rounded-lg font-medium">{saving ? '...' : '保存'}</button>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-bold text-text truncate">{user?.nickname || '未设置昵称'}</h2>
                <p className="text-sm text-text-secondary mt-0.5">账号：{user?.account}</p>
                {user?.userCode && <p className="text-xs text-primary mt-0.5">代号：#{user.userCode}</p>}
              </>
            )}
          </div>
        </div>
        {!editing && (
          <button onClick={() => { setNickname(user?.nickname || ''); setEditing(true); }} className="mt-4 w-full py-2.5 bg-bg rounded-xl text-sm text-text-secondary font-medium active:bg-gray-100 transition">
            编辑资料
          </button>
        )}
      </div>

      <div className="mt-2 bg-white">
        {menuItems.map(item => (
          <button
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className="w-full px-5 py-3.5 flex items-center gap-3.5 active:bg-gray-50 transition-colors border-b border-border"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary">
              <path d={item.icon}/>
            </svg>
            <span className="flex-1 text-left text-sm text-text">{item.label}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary/30">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        ))}
      </div>

      <div className="mt-2 bg-white px-5 py-3">
        <button onClick={handleLogout} className="w-full py-3 text-danger text-sm font-medium active:bg-red-50 rounded-xl transition">
          退出登录
        </button>
      </div>

      <p className="text-center text-xs text-text-secondary/30 mt-auto pb-4">ChatApp v1.0.1</p>
    </div>
  );
}
