import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Register from './pages/Register';
import SessionList from './pages/SessionList';
import ChatRoom from './pages/ChatRoom';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Friends from './pages/Friends';
import UserProfile from './pages/UserProfile';
import Search from './pages/Search';
import BottomNav from './components/BottomNav';

function ProtectedLayout() {
  const token = useStore(s => s.token);
  const fetchProfile = useStore(s => s.fetchProfile);
  const fetchNotifications = useStore(s => s.fetchNotifications);
  const initSocket = useStore(s => s.initSocket);
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (token && !initialized.current) {
      initialized.current = true;
      fetchProfile();
      fetchNotifications();
      initSocket();
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;

  const noNavPaths = ['/chat/', '/user/', '/search'];
  const showNav = !noNavPaths.some(p => location.pathname.startsWith(p));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      {showNav && <BottomNav />}
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/chat" element={<SessionList />} />
            <Route path="/chat/:sessionId" element={<ChatRoom />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Route>
        </Routes>
      </div>
    </HashRouter>
  );
}
