import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('notifSettings') || '{}'); } catch(e) { return {}; }
  });

  const toggle = (key: string) => {
    const next = { ...settings, [key]: !(settings[key] ?? true) };
    setSettings(next);
    localStorage.setItem('notifSettings', JSON.stringify(next));
  };

  const items = [
    { key: 'messageNotif', label: '新消息通知', desc: '收到新消息时显示通知提醒' },
    { key: 'friendRequest', label: '好友申请通知', desc: '收到好友申请时显示通知提醒' },
    { key: 'sound', label: '消息提示音', desc: '收到新消息时播放提示音' },
    { key: 'vibrate', label: '震动提醒', desc: '收到新消息时震动提示' },
    { key: 'preview', label: '消息预览', desc: '在通知中显示消息内容预览' },
  ];

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      <div className="bg-white px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-text">通知设置</h1>
      </div>

      <div className="mt-2 bg-white">
        {items.map(item => (
          <div key={item.key} className="px-5 py-4 flex items-center border-b border-border/50">
            <div className="flex-1">
              <p className="text-sm font-medium text-text">{item.label}</p>
              <p className="text-xs text-text-secondary mt-0.5">{item.desc}</p>
            </div>
            <button
              onClick={() => toggle(item.key)}
              className={'relative w-12 h-7 rounded-full transition-colors duration-200 ' + ((settings[item.key] ?? true) ? 'bg-primary' : 'bg-gray-200')}
            >
              <div className={'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ' + ((settings[item.key] ?? true) ? 'translate-x-5' : 'translate-x-0.5')} />
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-text-secondary/40 mt-6 px-8">关闭通知后，你将不会收到相应的消息提醒</p>
    </div>
  );
}

