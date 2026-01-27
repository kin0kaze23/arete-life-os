import React from 'react';
import { Briefcase, Compass, Hash, Heart, User, Users, Wallet } from 'lucide-react';
import { Category } from '@/data';

export const getCategoryIcon = (cat: Category, size = 18) => {
  switch (cat) {
    case Category.HEALTH:
      return <Heart size={size} />;
    case Category.FINANCE:
      return <Wallet size={size} />;
    case Category.RELATIONSHIPS:
      return <Users size={size} />;
    case Category.SPIRITUAL:
      return <Compass size={size} />;
    case Category.WORK:
      return <Briefcase size={size} />;
    case Category.PERSONAL:
      return <User size={size} />;
    default:
      return <Hash size={size} />;
  }
};
