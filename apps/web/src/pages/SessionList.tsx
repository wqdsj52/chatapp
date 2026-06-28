import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function SessionList() {
  const navigate = useNavigate();
  const { sessions, fetchSessions, user, setCurrentSession, isOnline } = useStore();

  useEffect(() => { fetchSessions(); }, []);

  const handleOpen = (sessionId: string) => {
    setCurrentSession(sessionId);
    navigate(`/chat/${sessionId}`);
  };

  return (
    <div className="h-full flex flex-col bg-white page-enter">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text tracking-tight">消息</h1>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
            {user?.nickname?.[0] || '?'}
          </div>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/50">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm mt-3">暂无会话</p>
          </div>
        ) : (
          sessions.map(s => {
            const other = s.type === 'single' ? s.otherMembers[0] : null;
            const displayName = s.type === 'group' ? (s.name || '群聊') : (other?.nickname || '未知');
            const online = other ? isOnline(other.id) : false;
            const lastMsg = s.lastMessage;
            const lastText = lastMsg
              ? (lastMsg.type === 'text' ? lastMsg.content : '[图片]')
              : '暂无消息';
            const lastTime = lastMsg ? dayjs(lastMsg.createdAt).fromNow() : '';

            return (
              <div
                key={s.id}
                onClick={() => handleOpen(s.id)}
                className="flex items-center gap-3.5 px-5 py-3.5 active:bg-gray-50 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={`w-13 h-13 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
                    s.type === 'group'
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                      : 'bg-gradient-to-br from-blue-400 to-primary'
                  }`}>
                    {s.type === 'group' ? '群' : displayName[0]}
                  </div>
                  {s.type === 'single' && online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-online rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 border-b border-border pb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-text truncate text-[15px]">{displayName}</span>
                    <span className="text-xs text-text-secondary/60 flex-shrink-0 ml-2">{lastTime}</span>
                  </div>
                  <p className="text-sm text-text-secondary truncate mt-0.5">{lastText}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
