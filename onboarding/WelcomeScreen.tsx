import React from 'react';
import { ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onNext: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onNext }) => {
  return (
    <div className="animate-fade-in">
      <div className="flex flex-col items-center justify-center mb-12">
        <svg width="80" height="80" viewBox="0 0 80 80" className="mb-6">
          <rect width="80" height="80" rx="16" fill="#4F46E5" />
          <text 
            x="40" 
            y="48" 
            textAnchor="middle" 
            className="fill-white text-3xl font-bold" 
            dominantBaseline="middle"
          >
            A
          </text>
        </svg>
        
        <h1 className="text-3xl font-black tracking-tight text-white text-center leading-tight mb-4">
          Start with the next 90 days.
        </h1>
        
        <p className="text-slate-400 text-center text-base mb-8 max-w-xs">
          We'll guide you through a quick setup to personalize your Life OS experience
        </p>
      </div>
      
      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          Get Started
          <ArrowRight size={16} />
        </button>
        
        <button
          className="w-full text-slate-400 hover:text-white text-sm font-medium uppercase tracking-wide transition-colors"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};