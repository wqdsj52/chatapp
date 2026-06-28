import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: '数据概览' },
  { to: '/users', label: '用户管理' },
  { to: '/sessions', label: '会话管理' },
  { to: '/messages', label: '消息审计' },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-slate-900 text-white flex flex-col flex-shrink-0">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-lg font-bold">ChatApp Admin</h1>
      </div>
      <nav className="flex-1 py-4 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-2.5 text-sm transition ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">v1.0.0</div>
    </aside>
  );
}
