import { useState, useRef } from 'react';
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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [bio, setBio] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [userCode, setUserCode] = useState('');

  const startEdit = () => {
    setNickname(user?.nickname || '');
    setGender(user?.gender || '');
    setBirthDate(user?.birthDate || '');
    setBio(user?.bio || '');
    setProvince(user?.province || '');
    setCity(user?.city || '');
    setAddress(user?.address || '');
    setUserCode(user?.userCode || '');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({ nickname, gender, birthDate, bio, province, city, address, userCode });
      // Merge API response with form data (API may not return extended fields)
      const merged = { ...updated, gender, birthDate, bio, province, city, address, userCode };
      setUser(merged);
      // Also save extended fields to localStorage directly
      localStorage.setItem('userExtra', JSON.stringify({ gender, birthDate, bio, province, city, address, userCode }));
      setEditing(false);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      console.error('Avatar upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { label: '通知设置', icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0', path: '/notification-settings' },
    { label: '好友列表', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', path: '/friends' },
    { label: '意见反馈', icon: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z', path: '/feedback' },
  ];

  return (
    <div className="h-full flex flex-col bg-bg page-enter overflow-y-auto">
      <div className="bg-white px-5 pt-14 pb-6">
        <h1 className="text-2xl font-bold text-text tracking-tight mb-5">我的</h1>
        <div className="flex items-center gap-4">
          {/* Avatar with click handler */}
          <div className="relative flex-shrink-0">
            <div
              onClick={handleAvatarClick}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-primary flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-primary/20 overflow-hidden cursor-pointer active:opacity-80"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <span>{(user?.nickname || 'U')[0]}</span>
              )}
            </div>
            {/* Camera icon overlay */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200" onClick={handleAvatarClick}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-text truncate">{user?.nickname || '未设置昵称'}</h2>
            <p className="text-sm text-text-secondary mt-0.5">账号：{user?.account}</p>
            {user?.userCode && <p className="text-xs text-primary mt-0.5">代号：#{user.userCode}</p>}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} className="mt-4 w-full py-2.5 bg-bg rounded-xl text-sm text-text-secondary font-medium active:bg-gray-100 transition">
            编辑资料
          </button>
        )}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="mt-2 bg-white px-5 py-4 space-y-3">
          <h3 className="text-sm font-semibold text-text mb-2">编辑个人资料</h3>
          <div>
            <label className="text-xs text-text-secondary font-medium">昵称</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="请输入昵称" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium">用户代号</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={userCode} onChange={e => setUserCode(e.target.value.replace(/[^0-9]/g, "").slice(0,8))} placeholder="8位数字代号，可留空自动生成" />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium">性别</label>
            <div className="flex gap-2 mt-1">
              {[{v:'male',l:'男'},{v:'female',l:'女'},{v:'other',l:'其他'}].map(g => (
                <button key={g.v} onClick={() => setGender(g.v)} className={'flex-1 py-2 rounded-lg text-sm font-medium transition ' + (gender === g.v ? 'bg-primary text-white' : 'bg-bg text-text-secondary')}>{g.l}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium">生日</label>
            <input type="date" className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={birthDate} onChange={e => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium">个性签名</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={bio} onChange={e => setBio(e.target.value)} placeholder="写点什么介绍自己" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-text-secondary font-medium">省份</label>
              <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={province} onChange={e => setProvince(e.target.value)} placeholder="省份" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-secondary font-medium">城市</label>
              <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={city} onChange={e => setCity(e.target.value)} placeholder="城市" />
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary font-medium">详细地址</label>
            <input className="w-full mt-1 px-3 py-2.5 rounded-xl bg-bg border-none outline-none text-sm" value={address} onChange={e => setAddress(e.target.value)} placeholder="街道/门牌号" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setEditing(false)} className="flex-1 py-2.5 bg-bg rounded-xl text-sm text-text-secondary font-medium">取消</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">{saving ? '保存中..' : '保存'}</button>
          </div>
        </div>
      )}

      {/* Profile details */}
      {!editing && (
        <div className="mt-2 bg-white">
          <InfoRow label="性别" value={user?.gender === 'male' ? '男' : user?.gender === 'female' ? '女' : user?.gender ? '其他' : ''} />
          <InfoRow label="生日" value={user?.birthDate || ''} />
          <InfoRow label="签名" value={user?.bio || ''} />
          <InfoRow label="地区" value={[user?.province, user?.city].filter(Boolean).join(' ') || ''} />
          <InfoRow label="地址" value={user?.address || ''} />
          <InfoRow label="手机" value={user?.phone || ''} />
        </div>
      )}

      {/* Menu */}
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

      {/* Logout */}
      <div className="mt-2 bg-white px-5 py-3">
        <button onClick={handleLogout} className="w-full py-3 text-danger text-sm font-medium active:bg-red-50 rounded-xl transition">
          退出登录
        </button>
      </div>

      <p className="text-center text-xs text-text-secondary/30 mt-auto pb-4">ChatApp v1.0.3</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-5 py-3 border-b border-border/50">
      <span className="text-sm text-text-secondary w-16">{label}</span>
      <span className="text-sm flex-1">{value}</span>
    </div>
  );
}





