import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userApi, friendApi, chatApi } from '../lib/api';
import { useStore } from '../store/useStore';

const GENDER_MAP: Record<string, string> = { male: '男', female: '女', other: '其他' };

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const me = useStore(s => s.user);
  const [profile, setProfile] = useState<any>(null);
  const [isFriend, setIsFriend] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      userApi.search(userId).then(list => list.find((u: any) => u.id === userId)),
      friendApi.check(userId).catch(() => ({ isFriend: false })),
    ]).then(([p, f]) => {
      setProfile(p);
      setIsFriend(f?.isFriend || false);
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleChat = async () => {
    try {
      const session = await chatApi.createSingleSession(userId!);
      navigate('/chat/' + session.id);
    } catch {}
  };

  if (loading) return <div className="flex items-center justify-center h-full text-text-secondary">加载中...</div>;
  if (!profile) return <div className="flex items-center justify-center h-full text-text-secondary">用户不存在</div>;

  return (
    <div className="h-full flex flex-col bg-bg overflow-y-auto">
      <div className="bg-white px-5 pt-14 pb-6 flex flex-col items-center">
        <button onClick={() => navigate(-1)} className="self-start mb-3 text-primary text-sm">← 返回</button>
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-3 overflow-hidden">
          {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" /> : <span className="text-3xl font-bold text-primary">{(profile.nickname || profile.account)[0]}</span>}
        </div>
        <div className="text-xl font-bold">{profile.nickname || profile.account}</div>
        {profile.userCode && <div className="text-sm text-primary mt-1">#{profile.userCode}</div>}
        <div className="text-xs text-text-secondary mt-1">@{profile.account}</div>
        {profile.bio && <div className="text-sm text-text-secondary mt-2 text-center px-8">{profile.bio}</div>}
        {me?.id !== userId && (
          <div className="flex gap-3 mt-4">
            <button onClick={handleChat} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium">发消息</button>
            <button onClick={async () => { try { await friendApi.add(userId!); setIsFriend(true); } catch {} }} className={'px-6 py-2 rounded-full text-sm font-medium ' + (isFriend ? 'bg-gray-100 text-text-secondary' : 'border border-primary text-primary')}>
              {isFriend ? '已好友' : '添加好友'}
            </button>
          </div>
        )}
      </div>
      <div className="bg-white mt-3">
        {profile.gender && <InfoRow label="性别" value={GENDER_MAP[profile.gender] || profile.gender} />}
        {profile.birthDate && <InfoRow label="生日" value={profile.birthDate} />}
        {(profile.province || profile.city) && <InfoRow label="地区" value={[profile.province, profile.city].filter(Boolean).join(' ')} />}
        {profile.address && <InfoRow label="地址" value={profile.address} />}
        {profile.phone && <InfoRow label="手机" value={profile.phone} />}
        <InfoRow label="注册" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : ''} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center px-5 py-3.5 border-b border-border/50">
      <span className="text-sm text-text-secondary w-16">{label}</span>
      <span className="text-sm flex-1">{value}</span>
    </div>
  );
}
