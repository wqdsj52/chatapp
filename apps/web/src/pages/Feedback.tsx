import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Feedback() {
  const navigate = useNavigate();
  const [type, setType] = useState('bug');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const types = [
    { v: 'bug', l: '问题反馈' },
    { v: 'feature', l: '功能建议' },
    { v: 'other', l: '其他' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) { setError('请输入反馈内容'); return; }
    setError('');
    setSubmitting(true);
    try {
      await api('/feedback', { method: 'POST', body: JSON.stringify({ type, content: content.trim(), contact }) });
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || '提交失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="h-full flex flex-col bg-bg page-enter">
        <div className="bg-white px-5 pt-14 pb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h1 className="text-xl font-bold text-text">意见反馈</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <h2 className="text-lg font-bold text-text">感谢你的反馈</h2>
          <p className="text-sm text-text-secondary mt-2 text-center">我们会认真阅读每一条反馈，持续改进产品体验</p>
          <button onClick={() => navigate('/profile')} className="mt-8 px-8 py-3 bg-primary text-white rounded-xl text-sm font-medium">返回个人中心</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-bg page-enter">
      <div className="bg-white px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-text">意见反馈</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Type selector */}
        <div className="mt-2 bg-white px-5 py-4">
          <label className="text-xs text-text-secondary font-medium mb-2 block">反馈类型</label>
          <div className="flex gap-2">
            {types.map(t => (
              <button
                key={t.v}
                onClick={() => setType(t.v)}
                className={'flex-1 py-2.5 rounded-xl text-sm font-medium transition ' + (type === t.v ? 'bg-primary text-white' : 'bg-bg text-text-secondary')}
              >{t.l}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mt-2 bg-white px-5 py-4">
          <label className="text-xs text-text-secondary font-medium mb-2 block">反馈内容</label>
          <textarea
            className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm resize-none h-40 focus:ring-2 focus:ring-primary/20 transition"
            placeholder="请详细描述你遇到的问题或建议，我们会尽快处理..."
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-text-secondary/50 mt-1 text-right">{content.length}/500</p>
        </div>

        {/* Contact */}
        <div className="mt-2 bg-white px-5 py-4">
          <label className="text-xs text-text-secondary font-medium mb-2 block">联系方式（选填）</label>
          <input
            className="w-full mt-1 px-4 py-3 rounded-xl bg-bg border-none outline-none text-sm focus:ring-2 focus:ring-primary/20 transition"
            placeholder="手机号 / 邮箱，方便我们联系你"
            value={contact}
            onChange={e => setContact(e.target.value)}
          />
        </div>

        {error && (
          <div className="mx-5 mt-3 bg-red-50 text-red-500 text-sm text-center py-2.5 rounded-xl">{error}</div>
        )}

        <div className="px-5 py-6">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold text-base transition-all disabled:opacity-50 shadow-lg shadow-primary/20 active:scale-[0.98]"
          >{submitting ? '提交中..' : '提交反馈'}</button>
        </div>
      </div>
    </div>
  );
}
