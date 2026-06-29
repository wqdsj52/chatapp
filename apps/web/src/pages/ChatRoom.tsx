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
  const chatMeta = useStore(s => s.chatMeta);
  const friends = useStore(s => s.friends);

  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [otherFromMsg, setOtherFromMsg] = useState<{ nickname: string; avatarUrl: string; id: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordTimeRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const messages = useMemo(() => messagesMap[sessionId || ''] || [], [messagesMap, sessionId]);
  const typingUsers = useMemo(() => typingUsersMap[sessionId || ''] || [], [typingUsersMap, sessionId]);
  const session = useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId]);

  const other = useMemo(() => {
    if (session?.type === 'single' && session.otherMembers.length > 0) return session.otherMembers[0];
    return (
      chatMeta?.[session?.id || ''] ||
      otherFromMsg ||
      (friends || []).find((f: any) => f.id === (session?.members || []).find((m: string) => m !== user?.id)) ||
      null
    );
  }, [session, otherFromMsg, chatMeta, friends, user?.id]);

  const displayName = session?.type === 'group' ? (session?.name || '群聊') : (other?.nickname || '未知');
  const isOnline = useMemo(() => (other ? onlineUsersArray.includes(other.id) : false), [other, onlineUsersArray]);

  // Fetch messages on mount
  useEffect(() => {
    if (sessionId && !fetchedRef.current) {
      fetchedRef.current = true;
      setCurrentSession(sessionId);
      fetchMessages(sessionId);
    }
    return () => { fetchedRef.current = false; };
  }, [sessionId, setCurrentSession, fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Resolve other from messages for single chats
  useEffect(() => {
    if (session?.type === 'single' && session.otherMembers.length === 0 && messages.length > 0) {
      for (const m of messages) {
        if (m.senderId !== user?.id && m.sender) {
          setOtherFromMsg({
            nickname: m.sender.nickname || '未知',
            avatarUrl: m.sender.avatarUrl || '',
            id: m.senderId,
          });
          break;
        }
      }
    }
  }, [session, messages, user?.id]);

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
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return;
        if (sessionId) {
          try {
            await chatApi.uploadVoice(sessionId, blob, recordTimeRef.current);
            fetchMessages(sessionId);
          } catch (e) {
            console.error('Voice upload failed:', e);
            alert('语音发送失败');
          }
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordTime(0); recordTimeRef.current = 0;
      recordTimerRef.current = setInterval(() => setRecordTime(t => { recordTimeRef.current = t + 1; return t + 1; }), 1000);
    } catch (e) {
      console.error('Microphone denied:', e);
      alert('无法访问麦克风');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    setRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const formatRecordTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
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

  function VoiceMessage({ url, duration }: { url: string; duration: number }) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [playing, setPlaying] = useState(false);

    const togglePlay = () => {
      if (!audioRef.current) {
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setPlaying(false);
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <span className="text-xs opacity-70">{duration}s</span>
      </div>
    );
  }

  function renderMessageContent(msg: { type: string; content: string }) {
    switch (msg.type) {
      case 'image':
        return (
          <img src={msg.content} alt="" className="max-w-[200px] rounded-lg" />
        );
      case 'file': {
        let fileName = '文件';
        let fileUrl = msg.content;
        let fileSize = '';
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.name) fileName = parsed.name;
          if (parsed.url) fileUrl = parsed.url;
          if (parsed.size) fileSize = formatFileSize(Number(parsed.size));
        } catch (e) {
          // not JSON, use content as URL
        }
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-inherit no-underline"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <div className="flex flex-col">
              <span className="text-sm">{fileName}</span>
              {fileSize && <span className="text-xs opacity-60">{fileSize}</span>}
            </div>
          </a>
        );
      }
      case 'voice': {
        let voiceUrl = msg.content;
        let duration = 0;
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.url) voiceUrl = parsed.url;
          if (parsed.duration) duration = Number(parsed.duration);
        } catch (e) {
          // not JSON, use content as URL
        }
        return <VoiceMessage url={voiceUrl} duration={duration} />;
      }
      default:
        return <span className="whitespace-pre-wrap break-words">{msg.content}</span>;
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-bg z-50">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-border/50 flex-shrink-0">
        <button
          onClick={() => navigate('/chat')}
          className="w-8 h-8 flex items-center justify-center rounded-full active:bg-gray-100 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text truncate">{displayName}</div>
          {session?.type === 'single' && (
            <div className="flex items-center gap-1">
              <span className={'w-1.5 h-1.5 rounded-full ' + (isOnline ? 'bg-emerald-500' : 'bg-gray-300')} />
              <span className="text-xs text-text-secondary">{isOnline ? '在线' : '离线'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((msg) => {
          const isSelf = msg.senderId === user?.id;
          const senderAvatar = msg.sender?.avatarUrl || '';
          const senderName = msg.sender?.nickname || '未知';
          return (
            <div key={msg.id} className={'flex gap-2 ' + (isSelf ? 'flex-row-reverse' : 'flex-row')}>
              <img
                src={senderAvatar || '/default-avatar.png'}
                alt=""
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 cursor-pointer"
                onClick={() => navigate('/user/' + msg.senderId)}
              />
              <div className={'flex flex-col max-w-[70%] ' + (isSelf ? 'items-end' : 'items-start')}>
                {!isSelf && (
                  <span className="text-xs text-text-secondary mb-1">{senderName}</span>
                )}
                <div
                  className={
                    'px-3 py-2 rounded-2xl text-sm ' +
                    (isSelf
                      ? 'bg-primary text-white rounded-tr-md'
                      : 'bg-white text-text rounded-tl-md shadow-sm')
                  }
                >
                  {renderMessageContent(msg)}
                </div>
                <span className="text-[10px] text-text-secondary/50 mt-1">
                  {dayjs(msg.createdAt).format('HH:mm')}
                </span>
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center gap-2 px-2">
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
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </div>
            <span className="text-xs text-text-secondary">相册</span>
          </button>
          <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <span className="text-xs text-text-secondary">拍照</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
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

      {/* Recording overlay */}
      {recording && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
            </div>
            <span className="text-lg font-mono text-text">{formatRecordTime(recordTime)}</span>
            <div className="flex gap-4">
              <button
                onClick={cancelRecording}
                className="px-6 py-2 rounded-full bg-gray-200 text-text text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={stopRecording}
                className="px-6 py-2 rounded-full bg-primary text-white text-sm font-medium"
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-3 py-2 pb-6 bg-white border-t border-border/50 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:bg-gray-100 transition flex-shrink-0"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={showMenu ? '#2563eb' : '#9ca3af'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={'transition-transform ' + (showMenu ? 'rotate-45' : '')}
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
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
        {input.trim() ? (
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-all shadow-md shadow-primary/20 active:scale-90"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-all active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}