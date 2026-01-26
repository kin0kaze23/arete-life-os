import React, { useEffect, useRef } from 'react';
import { MessageSquare, BrainCircuit, ExternalLink, Wallet, Heart, TrendingUp } from 'lucide-react';
import { EmptyState } from '../shared/EmptyState';
import { NeuralProcessor } from '../shared/SharedUI';
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
    <div className="max-w-3xl mx-auto h-[calc(100vh-250px)] flex flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-8 pb-12 pr-4 no-scrollbar">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
            <EmptyState
              icon={<MessageSquare />}
              title="Neural Oracle"
              description="The repository of your internalized intelligence. Ask about patterns, trajectories, or specific profile nodes."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl px-4">
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(s.text)}
                  className="glass-panel text-left p-6 rounded-[2rem] border border-white/5 hover:border-indigo-500 hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="p-4 bg-slate-950 rounded-2xl shadow-inner group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors">
                      {s.icon}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">
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
            className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4 duration-500 group`}
          >
            <div
              className={`max-w-[90%] p-8 rounded-[2.5rem] shadow-2xl ${chat.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white/[0.03] border border-white/5 text-slate-200'}`}
            >
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => (
                      <p className="mb-4 last:mb-0 leading-relaxed font-medium">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc ml-5 mb-4 space-y-2">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal ml-5 mb-4 space-y-2">{children}</ol>
                    ),
                    code: ({ inline, children }: any) =>
                      inline ? (
                        <code className="bg-slate-950 px-2 py-0.5 rounded text-indigo-400 font-mono text-xs">
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-black/40 rounded-2xl p-5 font-mono text-[11px] border border-white/5 overflow-x-auto my-4">
                          <code className="text-emerald-400">{children}</code>
                        </pre>
                      ),
                    strong: ({ children }) => (
                      <strong className="font-black text-indigo-400">{children}</strong>
                    ),
                  }}
                >
                  {chat.text}
                </ReactMarkdown>
              </div>
              {chat.sources && chat.sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em]">
                    Grounding Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {chat.sources.map((src, sIdx) => (
                      <a
                        key={sIdx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 rounded-xl text-[10px] font-bold text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all border border-indigo-500/20"
                      >
                        <ExternalLink size={12} /> {src.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-3 px-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(chat.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300 w-full">
            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] w-full max-w-md shadow-2xl">
              <NeuralProcessor />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
