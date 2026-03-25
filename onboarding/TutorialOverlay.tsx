import React, { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';

interface TutorialOverlayProps {
  onSkip: () => void;
  onFinish: () => void;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  onSkip,
  onFinish,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const steps = [
    {
      id: 1,
      title: 'LifePulse Bar',
      description: 'Your life overview across 5 dimensions - see how you\'re trending each dimension'
    },
    {
      id: 2,
      title: 'Do & Watch',
      description: 'Action items assigned by AI and potential blind spots to monitor'
    },
    {
      id: 3,
      title: 'Log Bar',
      description: 'Send signals to your AI assistant anytime - text, files, or voice'
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const toggleCompletion = () => {
    if (completedSteps.has(currentStep)) {
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentStep);
        return newSet;
      });
    } else {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white">Dashboard Tour</h2>
        <div className="flex space-x-1">
          {steps.map(step => (
            <div 
              key={step.id}
              className={`w-3 h-3 rounded-full ${
                step.id <= currentStep ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      <div className="space-y-6 mb-10">
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <span className="text-indigo-400 font-bold">{currentStep}</span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">{steps[currentStep - 1]?.title}</h3>
              <p className="text-slate-300 mb-4">{steps[currentStep - 1]?.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={toggleCompletion}
                  className={`flex items-center gap-2 text-sm font-medium ${
                    completedSteps.has(currentStep) 
                      ? 'text-emerald-400' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {completedSteps.has(currentStep) ? (
                    <>
                      <Check size={16} /> Got it!
                    </>
                  ) : (
                    'Mark as completed'
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setCurrentStep(3); // Go to final step
                    setCompletedSteps(new Set([1, 2, 3])); // Mark all as complete
                  }}
                  className="text-indigo-400 text-sm font-medium hover:text-indigo-300"
                >
                  Skip tutorial
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Visualization of dashboard element */}
        <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-400 uppercase font-bold">Visualization</span>
            <span className="text-xs text-indigo-400">Interactive</span>
          </div>
          <div className="flex gap-4">
            {/* LifePulse Bar mockup */}
            {currentStep === 1 && (
              <>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Health</span>
                    <span className="text-xs text-slate-300">75%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className="h-2 bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-400">Finance</span>
                    <span className="text-xs text-slate-300">45%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full">
                    <div className="h-2 bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>
              </>
            )}
            
            {/* Do & Watch mockup */}
            {currentStep === 2 && (
              <div className="w-full">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">DO</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-700/50 rounded border border-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs text-slate-300">Morning routine health check</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">WATCH</h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-slate-700/50 rounded border border-slate-600">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="text-xs text-slate-300">Budget tracking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Log Bar mockup */}
            {currentStep === 3 && (
              <div className="w-full">
                <div className="p-3 bg-slate-700 rounded-lg">
                  <div className="flex items-center">
                    <input 
                      type="text" 
                      placeholder="Log something you're thinking about..."
                      className="flex-1 bg-transparent text-slate-300 text-sm outline-none placeholder-slate-500"
                    />
                    <button className="ml-2 text-slate-400 hover:text-white">
                      <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="0.5" fill="none"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep <= 1}
            className={`py-3 px-6 rounded-xl font-medium text-sm ${
              currentStep <= 1 
                ? 'text-slate-600 cursor-not-allowed' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={completedSteps.size === steps.length ? onFinish : nextStep}
            className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center gap-2"
          >
            {currentStep === steps.length ? 'Finish Tour' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </div>
        
        <button
          onClick={onSkip}
          className="w-full text-slate-400 hover:text-slate-300 text-sm font-medium py-3"
        >
          Skip Tutorial
        </button>
      </div>
    </div>
  );
};