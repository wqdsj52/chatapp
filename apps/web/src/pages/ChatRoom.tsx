import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { chatApi } from '../lib/api';
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
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (file: File) => {
    if (!sessionId || !file) return;
    setShowMenu(false);
    setUploading(true);
    try {
      await chatApi.uploadFile(sessionId, file);
      fetchMessages(sessionId);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderMessageContent = (msg: { type: string; content: string }) => {
    if (msg.type === 'image') {
      let url = msg.content;
      try { const parsed = JSON.parse(msg.content); url = parsed.url; } catch {}
      return <img src={url} alt="image" className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer" onClick={() => window.open(url, '_blank')} />;
    }
    if (msg.type === 'file') {
      let fileData: any = {};
      try { fileData = JSON.parse(msg.content); } catch { return <p>{msg.content}</p>; }
      return (
        <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 no-underline">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate max-w-[160px]">{fileData.name}</p>
            <p className="text-xs opacity-70">{formatFileSize(fileData.size)}</p>
          </div>
        </a>
      );
    }
    return <p>{msg.content}</p>;
  };

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-white/80 backdrop-blur-lg border-b border-border/50 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => navigate('/chat')} className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 min-w-0" onClick={() => other && navigate('/user/' + other.id)} style={{ cursor: other ? 'pointer' : 'default' }}>
          <h2 className="font-bold text-text truncate text-[16px]">{displayName}</h2>
          {session?.type === 'single' && (
            <p className={'text-xs ' + (isOnline ? 'text-online font-medium' : 'text-text-secondary/60')}>{isOnline ? '在线' : '离线'}</p>
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
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="text-sm mt-2">开始聊天吧</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isSelf = msg.senderId === user?.id;
          const showAvatar = !isSelf && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
          const showTime = i === 0 || dayjs(msg.createdAt).diff(dayjs(messages[i - 1]?.createdAt), 'minute') > 5;
          const avatarUrl = isSelf ? user?.avatarUrl : msg.sender?.avatarUrl;

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="text-center text-[11px] text-text-secondary/40 my-3 font-medium">
                  {dayjs(msg.createdAt).format('HH:mm')}
                </div>
              )}
              <div className={'flex items-end gap-2 ' + (isSelf ? 'flex-row-reverse' : '') + (!isSelf && !showAvatar ? ' pl-10' : '') + (isSelf && i > 0 && messages[i - 1]?.senderId === user?.id ? ' pr-10' : '')}>
                {((!isSelf && showAvatar) || (isSelf && (i === 0 || messages[i - 1]?.senderId !== user?.id))) && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5 overflow-hidden bg-gradient-to-br from-blue-400 to-primary" onClick={() => { if (!isSelf && msg.sender?.id) navigate('/user/' + msg.sender.id); }} style={{ cursor: !isSelf ? 'pointer' : 'default' }}>
                    {avatarUrl ? <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" /> : (isSelf ? (user?.nickname?.[0] || '?') : (msg.sender?.nickname?.[0] || '?'))}
                  </div>
                )}
                <div className={'msg-bubble ' + (isSelf ? 'self' : 'other')}>
                  {!isSelf && showAvatar && session?.type === 'group' && (
                    <p className="text-[11px] text-primary font-medium mb-0.5">{msg.sender?.nickname}</p>
                  )}
                  {renderMessageContent(msg)}
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

      {/* Attachment menu popup */}
      {showMenu && (
        <div className="px-4 py-3 bg-white border-t border-border/50 flex gap-4 justify-center">
          <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
            <span className="text-xs text-text-secondary">相册</span>
          </button>
          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <span className="text-xs text-text-secondary">拍照</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <span className="text-xs text-text-secondary">文件</span>
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />

      {/* Upload progress overlay */}
      {uploading && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-text">上传中...</span>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-2 pb-6 bg-white border-t border-border/50 flex items-center gap-2 flex-shrink-0">
        <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition flex-shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={showMenu ? '#2563eb' : '#9ca3af'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'transition-transform ' + (showMenu ? 'rotate-45' : '')}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <input
          name="message-input"
          className="flex-1 px-4 py-2.5 rounded-2xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition placeholder:text-text-secondary/40"
          placeholder="输入消息..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => setShowMenu(false)}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all disabled:opacity-20 send-btn shadow-md shadow-primary/20 active:scale-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

