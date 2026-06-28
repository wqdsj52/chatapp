import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function Notifications() {
  const notifications = useStore(s => s.notifications);
  const fetchNotifications = useStore(s => s.fetchNotifications);
  const markNotifRead = useStore(s => s.markNotifRead);

  useEffect(() => { fetchNotifications(); }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full flex flex-col bg-white page-enter">
      <div className="px-5 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text tracking-tight">通知</h1>
          {unreadCount > 0 && (
            <span className="bg-danger text-white text-xs font-bold px-2.5 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/50">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <p className="text-sm mt-3">暂无通知</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && markNotifRead(n.id)}
              className={`px-5 py-4 border-b border-border cursor-pointer active:bg-gray-50 transition-colors ${!n.read ? 'bg-primary-light/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                <div className={`flex-1 ${n.read ? 'ml-5' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${n.read ? 'text-text-secondary' : 'text-text font-semibold'}`}>{n.title}</span>
                    <span className="text-[11px] text-text-secondary/50">{dayjs(n.createdAt).fromNow()}</span>
                  </div>
                  <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{n.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
