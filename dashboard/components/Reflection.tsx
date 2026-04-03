import React from 'react';
import { Sparkles } from 'lucide-react';

interface ReflectionProps {
  text: string;
}

export const Reflection: React.FC<ReflectionProps> = ({ text }) => {
  return (
    <div className="mt-12 mb-20 text-center space-y-4 px-6 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />

      <Sparkles className="w-6 h-6 text-indigo-400/50 mx-auto" />

      <p className="text-lg md:text-xl font-medium text-white/80 leading-relaxed tracking-tight max-w-lg mx-auto italic">
        "{text}"
      </p>
    </div>
  );
};
