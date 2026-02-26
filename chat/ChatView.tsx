import React, { useEffect } from 'react';
import {
  MessageSquare,
  BrainCircuit,
  ExternalLink,
  Wallet,
  Heart,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { EmptyState, NeuralProcessor } from '@/shared';
import ReactMarkdown from 'react-markdown';

interface ChatViewProps {
  chatHistory: {
    role: 'user' | 'aura';
    text: string;
    timestamp: number;
    sources?: { title: string; uri: string }[];
  }[];
  isProcessing: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSendMessage: (text: string) => void;
}

const SUGGESTIONS = [
  {
    text: 'Analyze my recent financial pulse',
    icon: <Wallet size={16} className="text-emerald-400" />,
  },
  { text: 'Summarize my biometric patterns', icon: <Heart size={16} className="text-rose-400" /> },
  {
    text: 'What is my primary mission today?',
    icon: <BrainCircuit size={16} className="text-indigo-400" />,
  },
  {
    text: 'Detect inconsistencies in my goals',
    icon: <TrendingUp size={16} className="text-cyan-400" />,
  },
];

export const ChatView: React.FC<ChatViewProps> = ({
  chatHistory,
  isProcessing,
  scrollRef,
  onSendMessage,
}) => {
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory, isProcessing]);

  return (
    <section className="mx-auto flex h-[calc(100vh-238px)] w-full max-w-[1320px] gap-5">
      <aside className="hidden w-[320px] shrink-0 rounded-3xl border border-white/10 bg-white/[0.03] p-5 xl:flex xl:flex-col">
        <div className="rounded-2xl border border-blue-300/25 bg-blue-500/12 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Assistant
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">Aura Context Mode</h3>
          <p className="mt-2 text-sm text-slate-300">
            Responses are grounded in your vault and recent journals.
          </p>
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Quick Prompts
          </p>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(s.text)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-blue-300/30 hover:bg-blue-500/10"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06]">
                  {s.icon}
                </span>
                <span className="text-xs font-medium text-slate-200">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="mt-auto rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Tip
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Ask with a timeframe, for example: "Summarize my finance signals from last 7 days."
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-blue-200" />
            <p className="text-sm font-semibold text-slate-100">Conversation</p>
          </div>
          <span className="text-xs text-slate-400">{chatHistory.length} messages</span>
        </div>

        <div
          ref={scrollRef}
          className="premium-scrollbar flex-1 space-y-5 overflow-y-auto pb-6 pr-2"
        >
        {chatHistory.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-8 px-3">
            <EmptyState
              icon={<MessageSquare />}
              title="Ask Aura"
              description="Use the assistant to reason over your journals, goals, and behavior patterns."
            />
            <div className="grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s.text)}
                  className="group rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-500/8"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-white/[0.05] p-2.5 text-slate-300 group-hover:bg-blue-500/15">
                      {s.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-200">
                      {s.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((chat, i) => (
          <div
            key={i}
            className={`group flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[84%] rounded-2xl border p-4 shadow-sm md:p-5 ${
                chat.role === 'user'
                  ? 'border-blue-300/40 bg-blue-500/20 text-slate-100'
                  : 'border-white/10 bg-black/20 text-slate-200'
              }`}
            >
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-3 ml-5 list-disc space-y-1.5">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-3 ml-5 list-decimal space-y-1.5">{children}</ol>
                    ),
                    code: ({ inline, children }: any) =>
                      inline ? (
                        <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-xs text-blue-200">
                          {children}
                        </code>
                      ) : (
                        <pre className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50 p-3 font-mono text-[11px]">
                          <code className="text-emerald-300">{children}</code>
                        </pre>
                      ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-blue-200">{children}</strong>
                    ),
                  }}
                >
                  {chat.text}
                </ReactMarkdown>
              </div>
              {chat.sources && chat.sources.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chat.sources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-blue-300/30 bg-blue-500/12 px-2.5 py-1.5 text-[11px] font-medium text-blue-100 transition hover:bg-blue-500/22"
                      >
                        <ExternalLink size={12} /> {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-2 px-2 text-[10px] text-slate-500 opacity-0 transition-opacity group-hover:opacity-100">
              {new Date(chat.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex w-full justify-start animate-in fade-in slide-in-from-left-2 duration-200">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20">
              <NeuralProcessor />
            </div>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};
