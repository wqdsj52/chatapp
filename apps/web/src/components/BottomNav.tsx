import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function BottomNav() {
  const notifications = useStore(s => s.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const tabs = [
    {
      path: '/chat',
      label: '消息',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    },
    {
      path: '/notifications',
      label: '通知',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      path: '/profile',
      label: '我的',
      icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    },
  ];

  return (
    <nav className="bg-white border-t border-border/50 flex justify-around py-1.5 pb-5 flex-shrink-0">
      {tabs.map(t => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 py-1 px-5 transition-colors ${isActive ? 'text-primary' : 'text-text-secondary/50'}`
          }
        >
          <div className="relative">
            {t.icon}
            {t.badge && (
              <span className="absolute -top-1 -right-2 bg-danger text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{t.badge > 9 ? '9+' : t.badge}</span>
            )}
          </div>
          <span className="text-[10px] font-medium">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
