import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const AVAILABLE_ICONS = [
  { name: 'Zap', label: 'Lightning' },
  { name: 'Flame', label: 'Fire / Streak' },
  { name: 'Target', label: 'Target / Goal' },
  { name: 'Dumbbell', label: 'Workout / Fitness' },
  { name: 'BookOpen', label: 'Reading / Book' },
  { name: 'Code', label: 'Coding / Tech' },
  { name: 'Moon', label: 'Sleep / Wind-down' },
  { name: 'Sun', label: 'Morning Routine' },
  { name: 'Droplets', label: 'Hydration / Water' },
  { name: 'Heart', label: 'Health / Cardio' },
  { name: 'Coffee', label: 'Diet / Nutrition' },
  { name: 'Activity', label: 'Movement / Steps' },
  { name: 'Feather', label: 'Writing / Journal' },
  { name: 'Compass', label: 'Mindfulness / Focus' },
  { name: 'Smile', label: 'Gratitude' },
  { name: 'CheckCircle2', label: 'Task Check' },
];

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string; size?: number }>>)[name];

  if (!IconComponent) {
    return <LucideIcons.CheckCircle2 className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};
