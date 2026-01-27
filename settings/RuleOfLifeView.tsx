import React, { useState } from 'react';
import {
  Compass,
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Info,
  Target,
  Clock,
  ShieldCheck,
  Zap,
  Calendar,
  Users,
  List,
  Activity,
} from 'lucide-react';
import { VaultInput, VaultSelect, VaultSlider, ActionTooltip, getCategoryColor } from '@/shared';
import { RuleOfLife, Goal, Category } from '@/data';

interface RuleOfLifeViewProps {
  ruleOfLife: RuleOfLife;
  goals: Goal[];
  onUpdateRule: (newRule: RuleOfLife) => void;
  onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
}

export const RuleOfLifeView: React.FC<RuleOfLifeViewProps> = ({
  ruleOfLife,
  goals,
  onUpdateRule,
  onUpdateGoal,
}) => {
  const [activeSection, setActiveSection] = useState<string | null>('season');
  const [editMode, setEditMode] = useState<string | null>(null);

  const [localRule, setLocalRule] = useState<RuleOfLife>(ruleOfLife);

  const handleSave = () => {
    onUpdateRule(localRule);
    setEditMode(null);
  };

  const toggleSection = (id: string) => {
    setActiveSection(activeSection === id ? null : id);
    if (editMode && editMode !== id) {
      setEditMode(null);
      setLocalRule(ruleOfLife);
    }
  };

  const toggleEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editMode === id) {
      handleSave();
    } else {
      setEditMode(id);
      setActiveSection(id);
      setLocalRule(ruleOfLife);
    }
  };

  const renderSectionHeader = (
    id: string,
    title: string,
    icon: React.ReactNode,
    preview: string
  ) => (
    <div
      onClick={() => toggleSection(id)}
      className={`flex items-center justify-between p-6 cursor-pointer transition-colors ${activeSection === id ? 'bg-indigo-600/10' : 'hover:bg-slate-900/40'}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-2xl ${activeSection === id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-900 text-slate-500'}`}
        >
          {icon}
        </div>
        <div>
          <h4
            className={`text-lg font-black tracking-tight ${activeSection === id ? 'text-white' : 'text-slate-300'}`}
          >
            {title}
          </h4>
          {!activeSection && (
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {preview}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <ActionTooltip label="Changes affect task generation" side="left">
          <Info size={14} className="text-slate-600" />
        </ActionTooltip>
        <button
          onClick={(e) => toggleEdit(id, e)}
          className={`p-2 rounded-xl transition-all ${editMode === id ? 'bg-emerald-500 text-white' : 'hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400'}`}
        >
          {editMode === id ? <Save size={18} /> : <Edit3 size={18} />}
        </button>
        {/* Fixed: size(20) was an incorrect syntax, replaced with size={20} */}
        {activeSection === id ? (
          <ChevronUp size={20} className="text-slate-500" />
        ) : (
          <ChevronDown size={20} className="text-slate-500" />
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-32 pt-6 px-4 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
            System Configuration
          </span>
        </div>
        <h3 className="text-4xl font-black tracking-tighter text-white">Rule of Life</h3>
        <p className="text-slate-400 font-medium max-w-xl">
          Define the non-negotiable primitives that govern your Life OS. Aura uses these rules to
          filter noise and prioritize signal.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'season',
            'Season & Context',
            <Compass size={20} />,
            `${localRule.season.name} • Lvl ${localRule.season.intensity}`
          )}

          {activeSection === 'season' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              {editMode === 'season' ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <VaultInput
                      label="Current Season Name"
                      value={localRule.season.name}
                      onChange={(v) =>
                        setLocalRule({ ...localRule, season: { ...localRule.season, name: v } })
                      }
                      placeholder="e.g. Building Phase"
                    />
                    <VaultSlider
                      label="Intensity Level"
                      value={localRule.season.intensity.toString()}
                      min={1}
                      max={10}
                      onChange={(v) =>
                        setLocalRule({
                          ...localRule,
                          season: { ...localRule.season, intensity: parseInt(v) },
                        })
                      }
                    />
                  </div>
                  <VaultInput
                    label="Context / Focus Theme"
                    value={localRule.season.context}
                    onChange={(v) =>
                      setLocalRule({ ...localRule, season: { ...localRule.season, context: v } })
                    }
                    placeholder="What is the main driver right now?"
                  />
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      Season
                    </span>
                    <p className="text-lg font-bold text-white mt-1">{ruleOfLife.season.name}</p>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      Intensity
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500"
                          style={{ width: `${ruleOfLife.season.intensity * 10}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono text-indigo-400">
                        {ruleOfLife.season.intensity}/10
                      </span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      Theme
                    </span>
                    <p className="text-sm font-medium text-slate-300 mt-1">
                      {ruleOfLife.season.context}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'values',
            'Values & Roles',
            <Users size={20} />,
            `${localRule.valuesRoles.roles.length} Active Roles`
          )}

          {activeSection === 'values' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              {editMode === 'values' ? (
                <>
                  <VaultInput
                    label="Core Values (Comma Separated)"
                    value={localRule.valuesRoles.values.join(', ')}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        valuesRoles: {
                          ...localRule.valuesRoles,
                          values: v
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder="e.g. Integrity, Curiosity"
                  />
                  <VaultInput
                    label="Active Roles (Comma Separated)"
                    value={localRule.valuesRoles.roles.join(', ')}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        valuesRoles: {
                          ...localRule.valuesRoles,
                          roles: v
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder="e.g. Father, Founder, Runner"
                  />
                </>
              ) : (
                <div className="space-y-6">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-3">
                      Core Values
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ruleOfLife.valuesRoles.values.map((val) => (
                        <span
                          key={val}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block mb-3">
                      Active Roles
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {ruleOfLife.valuesRoles.roles.map((role) => (
                        <span
                          key={role}
                          className="px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'rhythm',
            'Weekly Rhythm',
            <Calendar size={20} />,
            `${localRule.weeklyRhythm.blockedTimes.length} Blocks defined`
          )}

          {activeSection === 'rhythm' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              {editMode === 'rhythm' ? (
                <>
                  <VaultSelect
                    label="Start of Week"
                    value={localRule.weeklyRhythm.startOfWeek}
                    options={['Monday', 'Sunday']}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        weeklyRhythm: { ...localRule.weeklyRhythm, startOfWeek: v },
                      })
                    }
                  />
                  <VaultInput
                    label="Blocked Times (Comma Separated)"
                    value={localRule.weeklyRhythm.blockedTimes.join(', ')}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        weeklyRhythm: {
                          ...localRule.weeklyRhythm,
                          blockedTimes: v
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                    placeholder="e.g. Sabbath: Sun, Deep Work: Mon 8-12"
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                      Structure: {ruleOfLife.weeklyRhythm.startOfWeek} Start
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {ruleOfLife.weeklyRhythm.blockedTimes.map((block, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800"
                      >
                        <Clock size={14} className="text-indigo-500" />
                        <span className="text-sm text-slate-300 font-medium">{block}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'negotiables',
            'Non-Negotiables',
            <ShieldCheck size={20} />,
            `Sleep: ${localRule.nonNegotiables.sleepWindow}`
          )}

          {activeSection === 'negotiables' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              {editMode === 'negotiables' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VaultInput
                    label="Sleep Window"
                    value={localRule.nonNegotiables.sleepWindow}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        nonNegotiables: { ...localRule.nonNegotiables, sleepWindow: v },
                      })
                    }
                    placeholder="11pm - 7am"
                  />
                  <VaultInput
                    label="Daily Devotion"
                    value={localRule.nonNegotiables.devotion}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        nonNegotiables: { ...localRule.nonNegotiables, devotion: v },
                      })
                    }
                    placeholder="30 mins reading"
                  />
                  <div className="col-span-full">
                    <VaultInput
                      label="Sabbath Protocol"
                      value={localRule.nonNegotiables.sabbath}
                      onChange={(v) =>
                        setLocalRule({
                          ...localRule,
                          nonNegotiables: { ...localRule.nonNegotiables, sabbath: v },
                        })
                      }
                      placeholder="Sundays - No screens"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { l: 'Sleep', v: ruleOfLife.nonNegotiables.sleepWindow, c: 'text-indigo-400' },
                    { l: 'Devotion', v: ruleOfLife.nonNegotiables.devotion, c: 'text-rose-400' },
                    { l: 'Sabbath', v: ruleOfLife.nonNegotiables.sabbath, c: 'text-emerald-400' },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-center text-center"
                    >
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-2">
                        {item.l}
                      </span>
                      <span className={`text-sm font-bold ${item.c}`}>{item.v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'goals',
            'Active Goals',
            <Target size={20} />,
            `${goals.filter((g) => g.status === 'active').length} Active Objectives`
          )}

          {activeSection === 'goals' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              <div className="space-y-3">
                {goals
                  .filter((g) => g.status === 'active')
                  .slice(0, 5)
                  .map((goal, idx) => (
                    <div
                      key={goal.id}
                      className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 group"
                    >
                      <div className="font-black text-slate-600 text-lg opacity-50">#{idx + 1}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="font-bold text-slate-200">{goal.title}</h5>
                          <span
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getCategoryColor(goal.category)}`}
                          >
                            {goal.category}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full"
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() =>
                            onUpdateGoal(goal.id, { progress: Math.min(100, goal.progress + 10) })
                          }
                          className="p-2 bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-xl transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                {goals.filter((g) => g.status === 'active').length === 0 && (
                  <div className="text-center py-8 text-slate-500 text-xs uppercase font-bold tracking-widest">
                    No active goals set
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-[2rem] overflow-hidden">
          {renderSectionHeader(
            'prefs',
            'Task Preferences',
            <List size={20} />,
            `Cap: ${localRule.taskPreferences.dailyCap} / ${localRule.taskPreferences.energyOffset}`
          )}

          {activeSection === 'prefs' && (
            <div className="p-8 border-t border-slate-800 bg-slate-900/20 space-y-6 animate-in slide-in-from-top-2">
              {editMode === 'prefs' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <VaultSlider
                    label="Daily Task Capacity"
                    value={localRule.taskPreferences.dailyCap.toString()}
                    min={1}
                    max={10}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        taskPreferences: { ...localRule.taskPreferences, dailyCap: parseInt(v) },
                      })
                    }
                  />
                  <VaultSelect
                    label="Energy Peak Offset"
                    value={localRule.taskPreferences.energyOffset}
                    options={['Morning Heavy', 'Afternoon Heavy', 'Balanced', 'Evening Heavy']}
                    onChange={(v) =>
                      setLocalRule({
                        ...localRule,
                        taskPreferences: { ...localRule.taskPreferences, energyOffset: v },
                      })
                    }
                  />
                  <div className="col-span-full flex items-center gap-3 p-4 bg-slate-900 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={localRule.taskPreferences.includeWeekends}
                      onChange={(e) =>
                        setLocalRule({
                          ...localRule,
                          taskPreferences: {
                            ...localRule.taskPreferences,
                            includeWeekends: e.target.checked,
                          },
                        })
                      }
                      className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-bold text-slate-300">
                      Generate Tasks on Weekends
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <Zap size={18} className="text-amber-400" />
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        Daily Cap
                      </span>
                      <p className="font-bold text-white">
                        {ruleOfLife.taskPreferences.dailyCap} Tasks
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <Activity size={18} className="text-indigo-400" />
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        Energy Flow
                      </span>
                      <p className="font-bold text-white">
                        {ruleOfLife.taskPreferences.energyOffset}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex items-center gap-3">
                    <Calendar size={18} className="text-emerald-400" />
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                        Weekend Protocol
                      </span>
                      <p className="font-bold text-white">
                        {ruleOfLife.taskPreferences.includeWeekends ? 'Active' : 'Rest'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
