import { Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../store/useAdmin';
import Sidebar from './Sidebar';

export default function Layout() {
  const admin = useAdmin(s => s.user);
  const logout = useAdmin(s => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <h2 className="text-sm font-medium text-gray-500">管理后台</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">登录账号：{admin?.account || '-'}{admin?.role === 'admin' ? ' (admin)' : ''}</span>
            <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition">退出登录</button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
