import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Activity, Power } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 font-inter text-slate-200">
          <div className="max-w-lg w-full bg-slate-900/50 backdrop-blur-xl border border-rose-500/30 rounded-[2rem] p-8 shadow-[0_0_50px_-12px_rgba(244,63,94,0.3)] text-center relative overflow-hidden">
            {/* Background Noise/Effect */}
            <div className="absolute inset-0 bg-rose-500/5 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20 shadow-lg shadow-rose-500/10 animate-pulse-slow">
                <AlertTriangle size={32} className="text-rose-500" />
              </div>

              <h2 className="text-2xl font-black tracking-tighter text-white mb-2">
                SYSTEM CRITICAL
              </h2>

              <p className="text-slate-400 text-sm font-medium mb-6 max-w-xs leading-relaxed">
                The neural core encountered an unrecoverable exception. Context coherence has been
                compromised.
              </p>

              {this.state.error && (
                <div className="w-full bg-slate-950/80 rounded-xl p-4 mb-8 border border-rose-900/30 text-left overflow-hidden">
                  <p className="font-mono text-[10px] text-rose-400 break-all">
                    <span className="opacity-50 select-none mr-2">$ ERROR:</span>
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-4 w-full">
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCcw size={14} strokeWidth={3} /> Reboot System
                </button>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">
                <Activity size={10} />
                <span>Diagnostics Logged</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
