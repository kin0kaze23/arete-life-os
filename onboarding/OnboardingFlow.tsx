import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './WelcomeScreen';
import { ProfileBasicsScreen } from './ProfileBasicsScreen';
import { GoalScreen } from './GoalScreen';
import { FirstInsightsScreen } from './FirstInsightsScreen';
import { TutorialOverlay } from './TutorialOverlay';
import { UserProfile, RuleOfLife } from '@/data';

interface OnboardingFlowProps {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  ruleOfLife: RuleOfLife;
  setRuleOfLife: React.Dispatch<React.SetStateAction<RuleOfLife>>;
  onComplete: () => void;
  logMemory: (input: string) => Promise<any>;
  runDeepInitialization?: () => Promise<string | void>;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  profile,
  setProfile,
  ruleOfLife,
  setRuleOfLife,
  onComplete,
  logMemory,
  runDeepInitialization,
}) => {
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'profile' | 'goal' | 'insights' | 'tutorial'>('welcome');
  const [collectedData, setCollectedData] = useState({
    age: '',
    location: '',
    role: '',
    goal: ''
  });
  const [displayFirstInsights, setDisplayFirstInsights] = useState(false);

  // Handle data collection across screens
  const updateCollectedData = (data: Partial<typeof collectedData>) => {
    setCollectedData(prev => ({ ...prev, ...data }));
  };

  // Navigate to the next screen
  const goToNextScreen = () => {
    switch(currentScreen) {
      case 'welcome':
        setCurrentScreen('profile');
        break;
      case 'profile':
        setCurrentScreen('goal');
        break;
      case 'goal':
        setCurrentScreen('insights');
        break;
      case 'insights':
        setCurrentScreen('tutorial');
        break;
      case 'tutorial':
        completeOnboarding();
        break;
    }
  };

  // Complete onboarding flow
  const completeOnboarding = async () => {
    try {
      await logMemory(
        'System Initialization sequence completed. Profile context fully calibrated.'
      );
      if (runDeepInitialization) {
        await runDeepInitialization();
      }
      
      // Update profile with collected data if needed
      setProfile(prev => ({
        ...prev,
        identify: {
          ...prev.identify,
          location: collectedData.location || prev.identify.location,
          lastUpdated: Date.now()
        },
        personal: {
          ...prev.personal,
          jobRole: collectedData.role || prev.personal.jobRole,
          lastUpdated: Date.now()
        }
      }));

      onComplete();
    } catch (err) {
      // Even if initialization fails, still complete onboarding
      onComplete();
    }
  };

  // Progress tracking - returns values between 0-100 for progress bar
  const getProgressPercentage = () => {
    switch(currentScreen) {
      case 'welcome': return 0;
      case 'profile': return 25;
      case 'goal': return 50;
      case 'insights': return 75;
      case 'tutorial': return 100;
      default: return 0;
    }
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch(currentScreen) {
      case 'welcome':
        return <WelcomeScreen onNext={goToNextScreen} />;
      case 'profile':
        return <ProfileBasicsScreen 
          collectedData={collectedData} 
          updateData={updateCollectedData} 
          onNext={goToNextScreen} 
          onSkip={() => setCurrentScreen('goal')} 
        />;
      case 'goal':
        return <GoalScreen 
          collectedData={collectedData} 
          updateData={updateCollectedData} 
          onNext={goToNextScreen}
          onSkip={() => {
            setDisplayFirstInsights(true);
            setCurrentScreen('insights');
          }} 
        />;
      case 'insights':
        return <FirstInsightsScreen 
          collectedData={collectedData} 
          displayInsights={displayFirstInsights}
          setDisplayInsights={setDisplayFirstInsights}
          onNext={goToNextScreen}
          onRegenerate={() => {
            // Allow regenerating insights if the user wants to see updated ones
            setDisplayFirstInsights(true);
          }}
          onSkip={() => setCurrentScreen('tutorial')} 
        />;
      case 'tutorial':
        return <TutorialOverlay onSkip={completeOnboarding} onFinish={completeOnboarding} />;
      default:
        return <WelcomeScreen onNext={goToNextScreen} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#02040a] flex items-center justify-center p-4 font-inter overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        {/* Progress bar - shows progress from 0% to 100% across all screens */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500">Onboarding</span>
            <span className="text-xs font-bold text-slate-500">
              {Math.round(getProgressPercentage())}% complete
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Screen Content */}
        {renderCurrentScreen()}
      </div>
    </div>
  );
};