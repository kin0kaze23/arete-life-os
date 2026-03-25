import React, { useState } from 'react';
import { ArrowRight, User, MapPin, Briefcase } from 'lucide-react';
import { VaultInput, VaultSelect } from '@/shared';

interface ProfileBasicsScreenProps {
  collectedData: {
    age: string;
    location: string;
    role: string;
  };
  updateData: (data: Partial<{ age: string; location: string; role: string }>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export const ProfileBasicsScreen: React.FC<ProfileBasicsScreenProps> = ({
  collectedData,
  updateData,
  onNext,
  onSkip,
}) => {
  const [age, setAge] = useState(collectedData.age);
  const [location, setLocation] = useState(collectedData.location);
  const [role, setRole] = useState(collectedData.role);

  const handleSubmit = () => {
    updateData({ age, location, role });
    onNext();
  };

  // Role options as specified in the requirements
  const roleOptions = ['Student', 'Professional', 'Parent', 'Entrepreneur', 'Other'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black text-white">Your Basics</h2>
        <div className="flex space-x-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          <div className="w-3 h-3 rounded-full bg-slate-700"></div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Age</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="number"
              min="18"
              max="80"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18-80"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-bold text-slate-400 mb-2">Role</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full appearance-none bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="" disabled>Select role</option>
              {roleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="mt-10 space-y-4">
        <button
          onClick={handleSubmit}
          disabled={!age || !location || !role}
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