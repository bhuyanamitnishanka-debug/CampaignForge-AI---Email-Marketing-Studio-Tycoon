import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X, ShieldCheck, PenTool, Compass, Loader2 } from 'lucide-react';
import { ChatMessage, CopilotRole, EmailCampaign } from '../types';

interface AiStrategistChatProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: EmailCampaign;
  onApplySubject?: (subject: string) => void;
}

const ROLES_CONFIG: Record<
  CopilotRole,
  { label: string; model: string; icon: any; color: string; desc: string }
> = {
  director: {
    label: 'Lifecycle Director',
    model: 'gemini-4-argon',
    icon: Compass,
    color: 'from-amber-500 to-rose-600',
    desc: 'Complex retention architecture, A/B strategy & funnel economics (gemini-4-argon)',
  },
  copywriter: {
    label: 'Conversion Copywriter',
    model: 'gemini-3.8-flash',
    icon: PenTool,
    color: 'from-indigo-500 to-violet-600',
    desc: 'Magnetic hooks, persuasive rhythm, objection handling (gemini-3.8-flash)',
  },
  auditor: {
    label: 'Deliverability Auditor',
    model: 'gemini-3.1-flash-lite',
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-600',
    desc: 'Rapid spam filter scrub, ISP compliance & inbox placement (gemini-3.1-flash-lite)',
  },
};

export const AiStrategistChat: React.FC<AiStrategistChatProps> = ({
  isOpen,
  onClose,
  campaign,
  onApplySubject,
}) => {
  const [role, setRole] = useState<CopilotRole>('copywriter');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-0',
      role: 'assistant',
      content: `Hello! I'm your AI Marketing Strategist. I have loaded context for "${campaign.title || 'your campaign'}". Select a role above (e.g. Director via gemini-4-argon, Copywriter via gemini-3.8-flash, or Deliverability Auditor via gemini-3.1-flash-lite) and ask me anything!`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const currentRoleConfig = ROLES_CONFIG[role];

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: textToSend.trim(),
      timestamp: Date.now(),
    };

    const newThread = [...messages, userMsg];
    setMessages(newThread);
    setInput('');
    setIsSending(true);

    try {
      const selectedSubject =
        campaign.subjectLines[campaign.selectedSubjectIndex]?.text ||
        campaign.subjectLines[0]?.text;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          messages: newThread.map((m) => ({ role: m.role, content: m.content })),
          campaignContext: {
            title: campaign.title,
            objective: campaign.objective,
            headline: campaign.headline,
            selectedSubject,
            introHook: campaign.introHook,
          },
        }),
      });

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: 'asst-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Analysis complete.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed || currentRoleConfig.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'assistant',
          content: 'I had trouble connecting to the model. Please verify server status and retry.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const QUICK_PROMPTS = [
    'Audit this email for spam words',
    'Write 3 high-urgency subject lines',
    'Draft a 48-hour follow-up email',
    'Make the primary CTA more irresistible',
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
      
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>AI Strategist Copilot</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-1.5 py-0.2 rounded">
                Multi-Turn
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context synced with active campaign</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close AI Strategist drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Selector Tabs (Mandatory Role & Model Affordance) */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Select Copilot Persona &amp; Model
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(ROLES_CONFIG) as CopilotRole[]).map((r) => {
            const conf = ROLES_CONFIG[r];
            const Icon = conf.icon;
            const isSelected = role === r;

            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-indigo-500 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {conf.label.split(' ')[0]}
                  </span>
                </div>
                <span className="block text-[9px] font-mono text-slate-400 truncate">
                  {conf.model}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          <span>{currentRoleConfig.desc}</span>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                {isUser ? (
                  <>
                    <span>You</span>
                    <User className="w-3 h-3 text-slate-400" />
                  </>
                ) : (
                  <>
                    <Bot className="w-3 h-3 text-indigo-400" />
                    <span>{currentRoleConfig.label}</span>
                    {m.modelUsed && (
                      <span className="font-mono text-[9px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/60 px-1 rounded">
                        {m.modelUsed}
                      </span>
                    )}
                  </>
                )}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-sm whitespace-pre-wrap'
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-950/40 border border-indigo-800/50 p-3 rounded-xl max-w-[80%]">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Generating response with {currentRoleConfig.model}...</span>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-4 py-2 bg-slate-950/50 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(qp)}
            disabled={isSending}
            className="flex-shrink-0 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/60 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${currentRoleConfig.label}...`}
            disabled={isSending}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isSending || !input.trim()}
            className={`p-2.5 rounded-xl font-bold text-white transition-all ${
              isSending || !input.trim()
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
            aria-label="Send message to AI copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};
