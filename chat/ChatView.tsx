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
  {
    text: 'Summarize my biometric patterns',
    icon: <Heart size={16} className="text-rose-400" />,
  },
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
  }, [chatHistory, isProcessing, scrollRef]);

  const hasMessages = chatHistory.length > 0;

  return (
    <section className="mx-auto grid h-[calc(100vh-236px)] w-full max-w-[1360px] grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col rounded-[28px] border border-white/10 bg-white/[0.03] p-5 xl:p-6">
        <div className="border-b border-white/10 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Assistant
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-100">
            Ask Aura from your private context
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            Ask questions about your journal, routines, priorities, and patterns. Add{' '}
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-blue-200">#research</span>{' '}
            when you explicitly want grounded current information.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
            <MessageSquare size={14} className="text-blue-200" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              Conversation
            </span>
          </div>
        </div>

        <div ref={scrollRef} className="premium-scrollbar flex-1 overflow-y-auto pb-4 pt-5 pr-2">
          {!hasMessages ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <EmptyState
                icon={<MessageSquare />}
                title="Ask Aura"
                description="Start with one concrete question. The clearer the question, the more useful the answer."
              />
              <div className="mt-8 grid w-full max-w-3xl grid-cols-1 gap-3 md:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    type="button"
                    onClick={() => onSendMessage(suggestion.text)}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 text-left transition hover:border-blue-300/35 hover:bg-blue-500/[0.08]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
                        {suggestion.icon}
                      </span>
                      <span className="text-sm font-medium text-slate-200">{suggestion.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`group flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl border p-4 md:p-5 ${
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
                          {chat.sources.map((src, sourceIndex) => (
                            <a
                              key={sourceIndex}
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
            </div>
          )}

          {isProcessing && (
            <div className="mt-4 flex w-full justify-start">
              <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/20">
                <NeuralProcessor />
              </div>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 xl:p-6">
        <div className="rounded-2xl border border-blue-300/25 bg-blue-500/10 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200">
            Context mode
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Aura answers from your vault first. Ask one direct question at a time for the clearest result.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-slate-300" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Quick prompts
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion.text}
                type="button"
                onClick={() => onSendMessage(suggestion.text)}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-left transition hover:border-blue-300/35 hover:bg-blue-500/[0.08]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
                  {suggestion.icon}
                </span>
                <span className="text-xs font-medium text-slate-200">{suggestion.text}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Useful pattern</p>
          <p className="mt-2 text-xs leading-6 text-slate-300">
            Best prompt shape: context + timeframe + question. Example: “Review my last 7 days of finance signals and tell me what changed.”
          </p>
        </div>
      </aside>
    </section>
  );
};
