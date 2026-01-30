import React, { useState } from 'react';
import { UserProfile, Language } from '@/data/types';
import { AlertCircle, CheckCircle2, Lock, Plus, X, Info, ChevronDown } from 'lucide-react';

interface DossierViewProps {
  title: string;
  section: keyof UserProfile;
  profile: UserProfile;
  updateProfile: (section: string, field: string, value: any) => void;
  schema: FormField[];
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'list' | 'currency' | 'select' | 'languages';
  options?: string[];
  suggestions?: string[]; // Quick chips for text/list inputs
  placeholder?: string;
  tooltip?: string;
  locked?: boolean;
  multiSelect?: boolean; // For select type
}

// --- SUB-COMPONENTS TO ISOLATE HOOKS ---

const SelectInput: React.FC<{
  value: any;
  options?: string[];
  multiSelect?: boolean;
  onChange: (val: any) => void;
}> = ({ value, options, multiSelect, onChange }) => {
  if (multiSelect) {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (opt: string) => {
      const newSet = selected.includes(opt)
        ? selected.filter((s: string) => s !== opt)
        : [...selected, opt];
      onChange(newSet);
    };
    return (
      <div className="flex flex-wrap gap-2">
        {options?.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`
                           text-xs px-3 py-1.5 rounded-full border transition-all
                           ${
                             selected.includes(opt)
                               ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                               : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                           }
                       `}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  } else {
    return (
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none appearance-none cursor-pointer py-1"
        >
          <option value="" className="bg-slate-900 text-slate-500">
            Select...
          </option>
          {options?.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-900 text-white">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
    );
  }
};

const LanguageInput: React.FC<{
  value: Language[];
  onChange: (val: Language[]) => void;
}> = ({ value, onChange }) => {
  const langs = value || [];
  const [isAdding, setIsAdding] = useState(false);
  const [tempLang, setTempLang] = useState('');
  const [tempProf, setTempProf] = useState('Native');

  const add = () => {
    if (tempLang) {
      onChange([...langs, { language: tempLang, proficiency: tempProf as any }]);
      setTempLang('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {langs.map((l, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-slate-800 border border-white/10 px-2 py-1 rounded text-xs"
          >
            <span className="text-slate-200">{l.language}</span>
            <span className="text-slate-500">|</span>
            <span className="text-indigo-400 uppercase text-[10px] tracking-wider">
              {l.proficiency}
            </span>
            <button
              onClick={() => {
                const next = [...langs];
                next.splice(i, 1);
                onChange(next);
              }}
              className="text-slate-600 hover:text-rose-400"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setIsAdding(true)}
          className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {isAdding && (
        <div className="flex gap-2 animate-in slide-in-from-top-2 p-2 bg-slate-800/50 rounded border border-white/5">
          <input
            autoFocus
            value={tempLang}
            onChange={(e) => setTempLang(e.target.value)}
            placeholder="Language..."
            className="bg-transparent border-b border-indigo-500/50 outline-none text-xs text-white w-24"
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <select
            value={tempProf}
            onChange={(e) => setTempProf(e.target.value)}
            className="bg-transparent text-xs text-slate-300 outline-none"
          >
            {['Native', 'Fluent', 'Intermediate', 'Basic'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button onClick={add} className="text-emerald-400 hover:text-emerald-300">
            <CheckCircle2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

const TagInput: React.FC<{
  value: string[];
  suggestions?: string[];
  onChange: (val: string[]) => void;
}> = ({ value, suggestions, onChange }) => {
  const list = Array.isArray(value) ? value : [];
  const [inputValue, setInputValue] = useState('');

  const addItem = (item: string) => {
    if (!list.includes(item)) {
      onChange([...list, item]);
    }
    setInputValue('');
  };

  const removeItem = (item: string) => {
    onChange(list.filter((i: string) => i !== item));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((item: string, i: number) => (
          <span
            key={i}
            className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-xs"
          >
            {item}
            <button onClick={() => removeItem(item)} className="hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              addItem(inputValue);
            }
            if (e.key === 'Backspace' && !inputValue && list.length > 0) {
              removeItem(list[list.length - 1]);
            }
          }}
          placeholder="Type & Enter..."
          className="bg-transparent outline-none text-xs text-slate-400 min-w-[80px]"
        />
      </div>
      {/* Suggestions */}
      {suggestions && (
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {suggestions
            .filter((s) => !list.includes(s))
            .map((s) => (
              <button
                key={s}
                onClick={() => addItem(s)}
                className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500 hover:bg-slate-700 hover:text-slate-300 transition-colors"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
};

const StandardInput: React.FC<{
  type: 'text' | 'number' | 'currency';
  value: any;
  placeholder?: string;
  onChange: (val: any) => void;
}> = ({ type, value, placeholder, onChange }) => {
  return (
    <input
      type={type === 'number' ? 'number' : 'text'}
      defaultValue={value}
      onBlur={(e) => {
        const val = e.target.value;
        if (val !== value) onChange(val);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          (e.target as HTMLInputElement).blur();
        }
      }}
      placeholder={placeholder || 'Empty'}
      className="w-full bg-transparent outline-none text-sm text-white placeholder-slate-600 font-mono"
    />
  );
};

// --- MAIN COMPONENT ---

export const DossierView: React.FC<DossierViewProps> = ({
  title,
  section,
  profile,
  updateProfile,
  schema,
}) => {
  const data = (profile as any)[section] || {};

  const handleUpdate = (key: string, value: any) => {
    updateProfile(String(section), key, value);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={12} className="text-emerald-500" />
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold tracking-widest uppercase">
              Authorized
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase font-mono">
            {title}
          </h1>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-600 font-mono">LAST UPDATED</div>
          <div className="text-xs text-slate-400 font-mono">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {schema.map((field) => {
          const value = data[field.key];
          const isEmpty =
            value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

          return (
            <div key={field.key} className="group relative">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  {field.label}
                </label>
                {field.tooltip && (
                  <div className="group/tooltip relative">
                    <Info size={12} className="text-slate-600 cursor-help" />
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 bg-slate-800 text-slate-300 text-xs p-2 rounded shadow-xl border border-white/10 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-10">
                      {field.tooltip}
                    </div>
                  </div>
                )}
                {isEmpty && <AlertCircle size={10} className="text-amber-500 opacity-50" />}
              </div>

              <div
                className={`
                                bg-slate-900/30 border border-white/5 rounded-lg p-3 transition-all hover:bg-slate-900/50 hover:border-indigo-500/30 focus-within:bg-slate-900 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50
                            `}
              >
                {field.type === 'select' && (
                  <SelectInput
                    value={value}
                    options={field.options}
                    multiSelect={field.multiSelect}
                    onChange={(val) => handleUpdate(field.key, val)}
                  />
                )}
                {field.type === 'languages' && (
                  <LanguageInput value={value} onChange={(val) => handleUpdate(field.key, val)} />
                )}
                {field.type === 'list' && (
                  <TagInput
                    value={value}
                    suggestions={field.suggestions}
                    onChange={(val) => handleUpdate(field.key, val)}
                  />
                )}
                {(field.type === 'text' ||
                  field.type === 'number' ||
                  field.type === 'currency') && (
                  <StandardInput
                    type={field.type}
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(val) => handleUpdate(field.key, val)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
