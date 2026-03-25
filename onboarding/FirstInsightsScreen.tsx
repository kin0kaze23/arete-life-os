import React, { useState, useEffect } from 'react';
import { ArrowRight, Lightbulb, Sparkles, TrendingUp } from 'lucide-react';

interface FirstInsightsScreenProps {
  collectedData: {
    age: string;
    location: string;
    role: string;
    goal: string;
  };
  displayInsights: boolean;
  setDisplayInsights: React.Dispatch<React.SetStateAction<boolean>>;
  onNext: () => void;
  onRegenerate: () => void;
  onSkip: () => void;
}

// Generate first insights based on profile + goal data
const generateFirstInsights = (data: { age: string; role: string; goal: string }) => {
  const insights = [];
  
  // Insight based on role
  if (data.role) {
    let roleAdvice = "";
    
    switch(data.role.toLowerCase()) {
      case 'student':
        roleAdvice = "As a student, focus on building a consistent study routine that balances academic work with personal well-being. Your goal of growth aligns well with this stage of knowledge acquisition.";
        break;
      case 'professional':
        roleAdvice = "Given your professional status, prioritize time management to accommodate your growth goal within work demands. Blocking specific hours for focus work can help achieve major objectives.";
        break;
      case 'parent':
        roleAdvice = "As a parent, look for growth opportunities that integrate into family time. Setting small daily goals that don't require exclusive focus will make achieving personal objectives more sustainable.";
        break;
      case 'entrepreneur':
        roleAdvice = "With your entrepreneurial background, your goal should complement business objectives where possible. This period of intense growth aligns with business building cycles.";
        break;
      default:
        roleAdvice = "Consider how your role shapes your capacity for change and growth. Your specific responsibilities may influence which growth strategies work best.";
    }
    
    insights.push({
      id: 1,
      title: "Role-Based Insight",
      description: roleAdvice,
      icon: <Sparkles />,
      color: "text-indigo-400"
    });
  }
  
  // Insight based on goal
  if (data.goal && data.goal.length > 0) {
    let goalInsight = "";
    
    if (data.goal.toLowerCase().includes('health') || data.goal.toLowerCase().includes('fitness')) {
      goalInsight = "Health-focused goals benefit from measurement. Track your progress with a health monitoring system to maintain momentum during inevitable challenges.";
    } else if (data.goal.toLowerCase().includes('career') || data.goal.toLowerCase().includes('job')) {
      goalInsight = "Career advancement requires strategic networking. Allocate time to connect with professionals in your field to increase your probability of opportunity recognition.";
    } else if (data.goal.toLowerCase().includes('learn') || data.goal.toLowerCase().includes('education')) {
      goalInsight = "Learning goals thrive with structured approaches. Break complex learning objectives into daily micro-habits to build momentum toward major achievements.";
    } else {
      goalInsight = "Your personalized goal setting indicates clear intention. Now, the key is translating aspiration into actionable daily steps with measurable progress indicators.";
    }
    
    insights.push({
      id: 2,
      title: "Goal Clarity",
      description: goalInsight,
      icon: <Lightbulb />,
      color: "text-emerald-400"
    });
  }
  
  // Insight based on age
  if (data.age) {
    const ageNum = parseInt(data.age);
    let ageBased = "";
    
    if (ageNum < 30) {
      ageBased = "Early life stages permit more risk for growth. Make sure your goal capitalizes on your ability to recover from learning setbacks with greater agility.";
    } else if (ageNum >= 30 && ageNum <= 50) {
      ageBased = "Peak productivity years benefit from focused effort. Balance your growth objectives with existing commitments while maintaining flexibility for adjustments.";
    } else if (ageNum > 50) {
      ageBased = "Mature perspectives offer strategic advantages for goal achievement. Leverage your accumulated wisdom to navigate growth obstacles more efficiently than others.";
    } else {
      ageBased = "Your life stage influences growth approaches. Consider how your current circumstances affect your method for achieving important goals.";
    }
    
    insights.push({
      id: 3,
      title: "Stage Awareness",
      description: ageBased,
      icon: <TrendingUp />,
      color: "text-amber-400"
    });
  }
  
  // Add a third insight if we don't have enough
  if (insights.length < 3) {
    insights.push({
      id: 3,
      title: "Personalized Approach",
      description: "Remember that progress happens in different seasons of life. Stay committed to your growth journey even during periods where results aren't immediately visible.",
      icon: <Lightbulb />,
      color: "text-purple-400"
    });
  }
  
  return insights.slice(0, 3); // Limit to 3 insights
};

export const FirstInsightsScreen: React.FC<FirstInsightsScreenProps> = ({
  collectedData,
  displayInsights,
  setDisplayInsights,
  onNext,
  onRegenerate,
  onSkip,
}) => {
  // Generate insights when displayInsights becomes true
  const [insights, setInsights] = useState<any[]>([]);
  
  useEffect(() => {
    if (displayInsights) {
      const generatedInsights = generateFirstInsights(collectedData);
      setInsights(generatedInsights);
    } else {
      // Initial loading state
      setInsights([
        { id: 'loading', title: 'Generating Insights...', description: 'AI analyzing your profile and goals...', icon: '...' }
      ]);
    }
  }, [displayInsights, collectedData]);
  
  // Automatically show insights after a delay to simulate processing
  useEffect(() => {
    if (!displayInsights) {
      const timer = setTimeout(() => {
        setDisplayInsights(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [displayInsights, setDisplayInsights]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white">Your First Insights</h2>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
        </div>
      </div>
      
      {/* Loading state */}
      {!displayInsights && insights.length === 1 && insights[0].id === 'loading' && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-slate-400 text-center">Generating your personalized insights...</p>
        </div>
      )}
      
      {/* Actual insights display */}
      {displayInsights && insights.length > 0 && (
        <div className="space-y-4 mb-10">
          {insights.map((insight, index) => (
            <div 
              key={insight.id || index}
              className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className={`mt-1 ${insight.color || 'text-indigo-400'}`}>
                  {insight.icon || '•'}
                </span>
                <div className="flex-1">
                  <h3 className="font-bold text-white mb-1">{insight.title}</h3>
                  <p className="text-slate-300 text-sm">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-4">
        <button
          onClick={onNext}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
        >
          Enter Dashboard
          <ArrowRight size={16} />
        </button>
        
        <div className="flex gap-3">
          <button
            onClick={onRegenerate}
            className="flex-1 text-slate-400 hover:text-white text-xs font-medium uppercase tracking-wide transition-colors py-2"
          >
            Regenerate
          </button>
          <button
            onClick={onSkip}
            className="flex-1 text-slate-400 hover:text-white text-xs font-medium uppercase tracking-wide transition-colors py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};