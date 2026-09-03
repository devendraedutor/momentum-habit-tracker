import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const AVAILABLE_ICONS = [
  { name: 'Flame', label: 'Fire / Streak' },
  { name: 'Zap', label: 'Energy / Power' },
  { name: 'Target', label: 'Target / Goal' },
  { name: 'Dumbbell', label: 'Workout / Gym' },
  { name: 'Activity', label: 'Steps / Cardio' },
  { name: 'Bike', label: 'Cycling / Sport' },
  { name: 'Heart', label: 'Health / Cardio' },
  { name: 'Droplets', label: 'Hydration / Water' },
  { name: 'Apple', label: 'Nutrition / Diet' },
  { name: 'Coffee', label: 'Coffee / Break' },
  { name: 'BookOpen', label: 'Reading / Book' },
  { name: 'Brain', label: 'Mind / Study' },
  { name: 'Code', label: 'Coding / Tech' },
  { name: 'Feather', label: 'Writing / Journal' },
  { name: 'Briefcase', label: 'Work / Career' },
  { name: 'CheckCircle2', label: 'Task / Action' },
  { name: 'Sun', label: 'Morning Routine' },
  { name: 'Moon', label: 'Sleep / Wind-down' },
  { name: 'Compass', label: 'Mindfulness / Zen' },
  { name: 'Smile', label: 'Gratitude / Mood' },
  { name: 'Sparkles', label: 'Spiritual / Magic' },
  { name: 'Shield', label: 'Abstinence / Clean' },
  { name: 'ShieldAlert', label: 'Quit / Break Habit' },
  { name: 'Ban', label: 'No / Stop Bad Habit' },
  { name: 'Clock', label: 'Time / Discipline' },
  { name: 'DollarSign', label: 'Savings / Money' },
  { name: 'Palette', label: 'Art / Creativity' },
  { name: 'Music', label: 'Music / Instruments' },
  { name: 'Lightbulb', label: 'Ideas / Learning' },
  { name: 'Footprints', label: 'Walking / Steps' },
  { name: 'Trophy', label: 'Victory / Goal' },
  { name: 'Award', label: 'Mastery / Quest' },
];

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name];

  if (!IconComponent) {
    return <LucideIcons.CheckCircle2 className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};
