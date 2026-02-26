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
  suggestions?: string[];
  placeholder?: string;
  tooltip?: string;
  locked?: boolean;
  multiSelect?: boolean;
}

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
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              selected.includes(opt)
                ? 'border-blue-300/35 bg-blue-500/16 text-blue-100'
                : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-transparent py-1 text-sm text-slate-100 outline-none"
      >
        <option value="" className="bg-slate-900 text-slate-500">
          Select...
        </option>
        {options?.map((opt) => (
          <option key={opt} value={opt} className="bg-slate-900 text-slate-100">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-500"
      />
    </div>
  );
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
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1"
          >
            <span className="text-xs text-slate-200">{l.language}</span>
            <span className="text-[10px] uppercase tracking-[0.1em] text-blue-200">{l.proficiency}</span>
            <button
              onClick={() => {
                const next = [...langs];
                next.splice(i, 1);
                onChange(next);
              }}
              className="text-slate-500 transition hover:text-rose-300"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-blue-300/30 bg-blue-500/14 px-2.5 py-1 text-xs text-blue-100 transition hover:bg-blue-500/22"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {isAdding && (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
          <input
            autoFocus
            value={tempLang}
            onChange={(e) => setTempLang(e.target.value)}
            placeholder="Language"
            className="w-24 border-b border-blue-300/35 bg-transparent text-xs text-slate-100 outline-none"
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
          <button onClick={add} className="text-emerald-300 transition hover:text-emerald-200">
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
    const trimmed = item.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      onChange([...list, trimmed]);
    }
    setInputValue('');
  };

  const removeItem = (item: string) => {
    onChange(list.filter((i: string) => i !== item));
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        {list.map((item: string, i: number) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full border border-blue-300/25 bg-blue-500/12 px-2 py-0.5 text-xs text-blue-100"
          >
            {item}
            <button onClick={() => removeItem(item)} className="transition hover:text-white">
              <X size={10} />
            </button>
          </span>
        ))}

        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue) {
              e.preventDefault();
              addItem(inputValue);
            }
            if (e.key === 'Backspace' && !inputValue && list.length > 0) {
              removeItem(list[list.length - 1]);
            }
          }}
          placeholder="Type & Enter"
          className="min-w-[90px] bg-transparent text-xs text-slate-300 outline-none placeholder:text-slate-500"
        />
      </div>

      {suggestions && (
        <div className="flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
          {suggestions
            .filter((s) => !list.includes(s))
            .map((s) => (
              <button
                key={s}
                onClick={() => addItem(s)}
                className="rounded-full border border-white/10 bg-white/[0.02] px-2 py-0.5 text-[10px] text-slate-400 transition hover:border-white/20 hover:text-slate-200"
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
      className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
    />
  );
};

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
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-5">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Lock size={12} className="text-emerald-300" />
            <span className="rounded-full border border-emerald-300/30 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
              Secured
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Last Updated</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {schema.map((field) => {
          const value = data[field.key];
          const isEmpty =
            value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

          return (
            <div key={field.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-2 flex items-center gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                  {field.label}
                </label>

                {field.tooltip && (
                  <div className="group/tooltip relative">
                    <Info size={12} className="cursor-help text-slate-500" />
                    <div className="pointer-events-none absolute left-full top-1/2 z-10 ml-2 w-52 -translate-y-1/2 rounded-md border border-white/10 bg-[#111827] p-2 text-xs text-slate-300 opacity-0 transition-opacity group-hover/tooltip:opacity-100">
                      {field.tooltip}
                    </div>
                  </div>
                )}

                {isEmpty && <AlertCircle size={11} className="text-amber-300" />}
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
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
