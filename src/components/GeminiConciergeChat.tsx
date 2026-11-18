import React, { useEffect, useRef, useState } from 'react';
import {
  MessageSquareText,
  X,
  Send,
  RotateCcw,
  ExternalLink,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface GroundingSource {
  title: string;
  uri: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}

interface GeminiConciergeChatProps {
  onScheduleVisit: () => void;
}

const STARTER_PROMPTS = [
  'Compare 2 BHK vs Luxury 1 BHK',
  'Commute to Manyata Tech Park & nearby Metro',
  'Water supply, parking & building rules',
];

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Welcome to AJ GRAND. Ask me about our five newly constructed 2 BHK and Luxury 1 BHK residences, room dimensions, building amenities, or nearby Bengaluru landmarks and commute routes.',
};

export const GeminiConciergeChat: React.FC<GeminiConciergeChatProps> = ({
  onScheduleVisit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const threadEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, sending]);

  const sendMessage = async (textOverride?: string) => {
    const trimmed = (textOverride ?? input).trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    if (!textOverride) {
      setInput('');
    }
    setErrorMsg(null);
    setSending(true);

    try {
      const apiHistory = nextHistory
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiHistory }),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        reply?: string;
        sources?: GroundingSource[];
        error?: string;
      };

      if (!res.ok || !data.ok || !data.reply) {
        setErrorMsg(
          data.error || 'Unable to get a response right now. Please try again.'
        );
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply!,
          sources: Array.isArray(data.sources) ? data.sources : undefined,
        },
      ]);
    } catch {
      setErrorMsg('Network error reaching the AJ GRAND Concierge.');
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setErrorMsg(null);
  };

  return (
    <div className="fixed bottom-20 md:bottom-[5.25rem] right-4 md:right-6 z-40">
      {isOpen ? (
        <div
          role="dialog"
          aria-label="AJ GRAND Concierge Chat"
          className="w-[calc(100vw-2rem)] sm:w-[390px] h-[500px] max-h-[calc(100vh-7.5rem)] bg-[#fbf9f6] border border-[#d1c5b8] rounded-[8px] shadow-warm-hover flex flex-col overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-[#1a1918] text-[#fbf9f6] px-4 py-3.5 flex items-center justify-between gap-3 border-b border-[#c5a880]/40 shrink-0">
            <div>
              <p className="font-editorial text-xl leading-tight">AJ GRAND Concierge</p>
              <p className="text-[11px] text-[#e0c298] tracking-[0.04em]">
                Residences &amp; Bengaluru Neighbourhood Guide
              </p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="Start new conversation"
                aria-label="Reset conversation"
                className="w-8 h-8 inline-flex items-center justify-center rounded-[4px] text-[#f2f0ed]/75 hover:text-[#fbf9f6] hover:bg-[#ffffff]/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close concierge chat"
                className="w-8 h-8 inline-flex items-center justify-center rounded-[4px] text-[#f2f0ed]/75 hover:text-[#fbf9f6] hover:bg-[#ffffff]/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#f5f3f0]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-[6px] text-xs md:text-[13px] leading-[1.6] whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#1a1918] text-[#fbf9f6]'
                      : 'bg-[#ffffff] text-[#1a1918] border border-[#e8e2d9]'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1.5 max-w-[88%] flex flex-col gap-1 pl-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#725b38]">
                      Google Search Sources
                    </span>
                    {msg.sources.map((src) => (
                      <a
                        key={src.uri}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#725b38] hover:underline truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Starter Prompts when conversation hasn't started */}
            {messages.length === 1 && !sending && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#605e5c]">
                  Suggested Questions
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      className="text-left px-3 py-2 text-xs font-medium bg-[#fbf9f6] border border-[#e8e2d9] text-[#1a1918] rounded-[4px] hover:border-[#c5a880] hover:bg-[#ffffff] transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sending && (
              <div className="flex items-start">
                <div className="px-3.5 py-2.5 bg-[#ffffff] border border-[#e8e2d9] rounded-[6px] inline-flex items-center gap-2 text-xs text-[#605e5c]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#725b38]" />
                  <span>Looking up details...</span>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 bg-[#fff1f0] border border-[#f5c2c0] rounded-[4px] flex items-start gap-2 text-xs text-[#93000a]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div ref={threadEndRef} />
          </div>

          {/* Direct Visit Quick Strip + Input Form */}
          <div className="bg-[#fbf9f6] border-t border-[#e8e2d9] p-3 space-y-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onScheduleVisit();
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#725b38] hover:text-[#1a1918] transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ready to tour? Schedule Site Visit</span>
            </button>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about units, rules, or nearby places..."
                disabled={sending}
                className="flex-1 px-3.5 py-2 text-xs md:text-sm bg-[#ffffff] text-[#1a1918] border border-[#d1c5b8] rounded-[4px] focus:border-[#725b38] focus:outline-none min-h-[40px]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Send message"
                className="w-10 h-10 inline-flex items-center justify-center bg-[#1a1918] text-[#fbf9f6] rounded-[4px] hover:bg-[#725b38] disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open AJ GRAND Concierge Chat"
          className="inline-flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] bg-[#1a1918] text-[#fbf9f6] border border-[#c5a880] rounded-[6px] shadow-warm-hover hover:bg-[#725b38] transition-colors min-h-[46px] cursor-pointer"
        >
          <MessageSquareText className="w-4 h-4 text-[#e0c298]" />
          <span>Ask Concierge</span>
        </button>
      )}
    </div>
  );
};
