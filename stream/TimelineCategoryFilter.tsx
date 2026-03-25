import React from 'react';
import { Category } from '@/data';

interface TimelineCategoryFilterProps {
  selectedCategories: Category[];
  onCategoryToggle: (category: Category) => void;
}

const categoryConfig: { category: Category; color: string; bgColor: string }[] = [
  {
    category: Category.HEALTH,
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/20 border-rose-500/30',
  },
  {
    category: Category.FINANCE,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 border-amber-500/30',
  },
  {
    category: Category.RELATIONSHIPS,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/20 border-violet-500/30',
  },
  {
    category: Category.PERSONAL,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20 border-indigo-500/30',
  },
  {
    category: Category.SPIRITUAL,
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/20 border-sky-500/30',
  },
];

export const TimelineCategoryFilter: React.FC<TimelineCategoryFilterProps> = ({
  selectedCategories,
  onCategoryToggle,
}) => {
  const isAllSelected = selectedCategories.length === categoryConfig.length;

  const toggleAll = () => {
    if (isAllSelected) {
      onCategoryToggle(Category.GENERAL);
    } else {
      categoryConfig.forEach(({ category }) => {
        if (!selectedCategories.includes(category)) {
          onCategoryToggle(category);
        }
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={toggleAll}
        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
          isAllSelected
            ? 'bg-slate-700 text-slate-200 border border-slate-600'
            : 'bg-slate-900/40 text-slate-500 border border-slate-800 hover:border-slate-700'
        }`}
      >
        All
      </button>
      {categoryConfig.map(({ category, color, bgColor }) => {
        const isSelected = selectedCategories.includes(category);
        return (
          <button
            key={category}
            onClick={() => onCategoryToggle(category)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
              isSelected
                ? `${bgColor} ${color}`
                : 'bg-slate-900/40 text-slate-500 border-slate-800 hover:border-slate-700'
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
};
