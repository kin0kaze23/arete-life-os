import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { X, Mic, ShieldCheck, Volume2, Loader2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { MemoryEntry, UserProfile } from './types';

interface VoiceAdvisorProps {
  profile: UserProfile;
  memory: MemoryEntry[];
  onClose: () => void;
}

export const VoiceAdvisor: React.FC<VoiceAdvisorProps> = ({ profile, memory, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  function decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  function encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return { data: encodeBase64(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      audioContextRef.current = outputCtx;
      const outNode = outputCtx.createGain();
      outNode.connect(outputCtx.destination);
      outputNodeRef.current = outNode;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            setIsActive(true);
            setIsConnecting(false);
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsSpeaking(true);
              const ctx = audioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNodeRef.current!);
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              };
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onerror: (e) => setError('Link unstable. Retry.'),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: `Areté Life OS Oracle. Guide ${profile.identify.name} to excellence.`,
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setError('Establishment failed.');
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    startSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      sourcesRef.current.forEach((s) => {
        try {
          s.stop();
        } catch (e) {}
      });
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-3xl animate-in fade-in duration-500">
      <div className="max-w-md w-full bg-[#0D1117] border border-white/5 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[120px] animate-pulse"></div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-500 hover:text-white"
        >
          <X size={24} />
        </button>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-10 relative">
            <div
              className={`w-32 h-32 rounded-full border-4 flex items-center justify-center transition-all duration-700 ${isActive ? 'border-indigo-500/30 scale-110' : 'border-slate-800'}`}
            >
              {isSpeaking ? (
                <div className="flex gap-1.5 h-12 items-center">
                  {[0.1, 0.3, 0.5, 0.2, 0.4].map((d, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-indigo-400 rounded-full animate-bounce"
                      style={{ height: '100%', animationDelay: `${d}s` }}
                    ></div>
                  ))}
                </div>
              ) : (
                <div
                  className={`p-6 rounded-full ${isActive ? 'bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.5)]' : 'bg-slate-900 text-slate-700'}`}
                >
                  {isConnecting ? (
                    <Loader2 size={40} className="animate-spin" />
                  ) : (
                    <Mic size={40} />
                  )}
                </div>
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                <ShieldCheck size={10} /> Live Link
              </div>
            )}
          </div>
          <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
            {error
              ? 'Kernel Fault'
              : isConnecting
                ? 'Establishing Link...'
                : isSpeaking
                  ? 'Oracle Responding'
                  : 'Areté Listening'}
          </h3>
          <p className="text-xs text-slate-500 font-medium max-w-[240px]">
            {error || 'Communicate clearly. Areté is optimizing for your excellence.'}
          </p>
          <button
            onClick={onClose}
            className="mt-12 bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest w-full"
          >
            Terminate Session
          </button>
        </div>
      </div>
    </div>
  );
};
