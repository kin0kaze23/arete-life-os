import React from 'react';
import { Heart, Sparkles, User, Users, Wallet } from 'lucide-react';
import { Category } from '../data/types';

export type CorePillar = {
  id: string;
  title: string;
  categories: Category[];
  icon: React.ReactNode;
  accent: string;
};

export const corePillars: CorePillar[] = [
  {
    id: 'health',
    title: 'Health',
    categories: [Category.HEALTH],
    icon: <Heart className="text-emerald-400" size={18} />,
    accent: 'emerald',
  },
  {
    id: 'finance',
    title: 'Finance',
    categories: [Category.FINANCE],
    icon: <Wallet className="text-sky-400" size={18} />,
    accent: 'sky',
  },
  {
    id: 'personal',
    title: 'Personal',
    categories: [Category.GENERAL, Category.WORK, Category.SOCIAL],
    icon: <User className="text-violet-400" size={18} />,
    accent: 'violet',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    categories: [Category.RELATIONSHIPS],
    icon: <Users className="text-rose-400" size={18} />,
    accent: 'rose',
  },
  {
    id: 'spiritual',
    title: 'Spiritual',
    categories: [Category.SPIRITUAL],
    icon: <Sparkles className="text-amber-300" size={18} />,
    accent: 'amber',
  },
];
