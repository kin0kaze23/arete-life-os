import React, { useState, useEffect } from 'react';
import { ArrowRight, Target } from 'lucide-react';

interface GoalScreenProps {
  collectedData: {
    age: string;
    location: string;
    role: string;
    goal: string;
  };
  updateData: (data: Partial<{ age: string; location: string; role: string; goal: string }>) => void;
  onNext: () => void;
  onSkip: () => void;
}

// Mock function to detect goal signals (as mentioned in the requirements)
const detectGoalSignals = (text: string) => {
  // This is a simplified version - would use the real detectGoalSignals function in implementation
  const signals = [];
  
  if (text.toLowerCase().includes('career') || text.toLowerCase().includes('job')) {
    signals.push('Career Focus');
  }
  
  if (text.toLowerCase().includes('health') || text.toLowerCase().includes('fitness') || text.toLowerCase().includes('workout')) {
    signals.push('Health & Fitness');
  }
  
  if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('study') || text.toLowerCase().includes('education')) {
    signals.push('Learning & Growth');
  }
  
  if (text.toLowerCase().includes('relationship') || text.toLowerCase().includes('family')) {
    signals.push('Relationship Building');
  }
  
  if (text.toLowerCase().includes('finance') || text.toLowerCase().includes('money') || text.toLowerCase().includes('saving')) {
    signals.push('Financial Focus');
  }
  
  if (signals.length === 0) {
    signals.push('General Improvement', 'Personal Development');
  }
  
  return signals.slice(0, 2); // Limit to 2 signals
};

export const GoalScreen: React.FC<GoalScreenProps> = ({
  collectedData,
  updateData,
  onNext,
  onSkip,
}) => {
  const [goal, setGoal] = useState(collectedData.goal);
  const [charCount, setCharCount] = useState(goal.length);
  const [goalPreview, setGoalPreview] = useState<{ focus: string; season: string } | null>(null);

  useEffect(() => {
    if (goal.length > 0) {
      const signals = detectGoalSignals(goal);
      if (signals.length > 0) {
        setGoalPreview({
          focus: signals[0],
          season: signals.length > 1 ? `+${signals[1]}` : ''
        });
      }
    } else {
      setGoalPreview(null);
    }
  }, [goal]);

  const handleSubmit = () => {
    updateData({ goal });
    onNext();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= 280) {
      setGoal(value);
      setCharCount(value.length);
    }
  };

  const isValidLength = goal.length >= 20;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white">Your Focus</h2>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">
            What's your biggest goal for the next 90 days?
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-3 text-slate-500" size={18} />
            <textarea
              value={goal}
              onChange={handleChange}
              placeholder="E.g., I want to improve my physical fitness, advance in my career, learn new skills, etc..."
              className="w-full min-h-[120px] bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className={`text-xs ${isValidLength ? 'text-emerald-400' : 'text-slate-500'}`}>
              {goal.length}/280 characters
            </span>
            {goal.length < 20 && (
              <span className="text-xs text-rose-400">Minimum 20 characters</span>
            )}
          </div>
        </div>
        
        {goalPreview && (
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-1">Your Focus Preview</h3>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{goalPreview.focus}</span>
              {goalPreview.season && (
                <span className="font-medium text-indigo-400">{goalPreview.season}</span>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-10 space-y-4">
        <button
          onClick={handleSubmit}
          disabled={!isValidLength}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={16} />
        </button>
        
        <button
          onClick={onSkip}
          className="w-full text-slate-400 hover:text-white text-sm font-medium uppercase tracking-wide transition-colors"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};