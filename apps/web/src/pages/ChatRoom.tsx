import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import dayjs from 'dayjs';

export default function ChatRoom() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const user = useStore(s => s.user);
  const sessions = useStore(s => s.sessions);
  const messagesMap = useStore(s => s.messages);
  const fetchMessages = useStore(s => s.fetchMessages);
  const sendWsMessage = useStore(s => s.sendWsMessage);
  const setCurrentSession = useStore(s => s.setCurrentSession);
  const typingUsersMap = useStore(s => s.typingUsers);
  const onlineUsersArray = useStore(s => s.onlineUsersArray);

  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);

  const messages = useMemo(() => messagesMap[sessionId || ''] || [], [messagesMap, sessionId]);
  const typingUsers = useMemo(() => typingUsersMap[sessionId || ''] || [], [typingUsersMap, sessionId]);
  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);
  const other = useMemo(() => session?.type === 'single' ? session.otherMembers[0] : null, [session]);
  const displayName = session?.type === 'group' ? (session?.name || '群聊') : (other?.nickname || '未知');
  const isOnline = useMemo(() => other ? onlineUsersArray.includes(other.id) : false, [other, onlineUsersArray]);

  useEffect(() => {
    if (sessionId && !fetchedRef.current) {
      fetchedRef.current = true;
      setCurrentSession(sessionId);
      fetchMessages(sessionId);
    }
    return () => { fetchedRef.current = false; };
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !sessionId) return;
    sendWsMessage(sessionId, 'text', text);
    setInput('');
  }, [input, sessionId, sendWsMessage]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-white/80 backdrop-blur-lg border-b border-border/50 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/chat')} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-text truncate text-[16px]">{displayName}</h2>
          {session?.type === 'single' && (
            <p className={`text-xs ${isOnline ? 'text-online font-medium' : 'text-text-secondary/60'}`}>{isOnline ? '在线' : '离线'}</p>
          )}
          {session?.type === 'group' && (
            <p className="text-xs text-text-secondary/60">{session.members.length} 人</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary/40">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p className="text-sm mt-2">开始聊天吧</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isSelf = msg.senderId === user?.id;
          const showAvatar = !isSelf && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          const showTime = i === 0 || dayjs(msg.createdAt).diff(dayjs(messages[i - 1]?.createdAt), 'minute') > 5;

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center text-[11px] text-text-secondary/40 my-3 font-medium">
                  {dayjs(msg.createdAt).format('HH:mm')}
                </div>
              )}
              <div className={`flex items-end gap-2 ${isSelf ? 'flex-row-reverse' : ''} ${!isSelf && !showAvatar ? 'pl-10' : ''}`}>
                {!isSelf && showAvatar && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5">
                    {msg.sender?.nickname?.[0] || '?'}
                  </div>
                )}
                <div className={`msg-bubble ${isSelf ? 'self' : 'other'}`}>
                  {!isSelf && showAvatar && session?.type === 'group' && (
                    <p className="text-[11px] text-primary font-medium mb-0.5">{msg.sender?.nickname}</p>
                  )}
                  <p>{msg.content}</p>
                </div>
              </div>
            </div>
          );
        })}

        {typingUsers.length > 0 && (
          <div className="flex items-center gap-1.5 pl-10 mt-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-text-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-text-secondary/40">对方正在输入</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-2 pb-6 bg-white border-t border-border/50 flex items-center gap-2 flex-shrink-0">
        <input
          name="message-input"
          className="flex-1 px-4 py-2.5 rounded-2xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition placeholder:text-text-secondary/40"
          placeholder="输入消息..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all disabled:opacity-20 send-btn shadow-md shadow-primary/20 active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
