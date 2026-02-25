// constants/Icons.ts
import { Ionicons } from '@expo/vector-icons';

export const TabIcons = {
  tasks: {
    active: 'checkbox' as const,
    inactive: 'checkbox-outline' as const,
  },
  diary: {
    active: 'journal' as const,
    inactive: 'journal-outline' as const,
  },
  notes: {
    active: 'document-text' as const,
    inactive: 'document-text-outline' as const,
  },
  analytics: {
    active: 'stats-chart' as const,
    inactive: 'stats-chart-outline' as const,
  },
};

export const FeatureIcons = {
  priority: {
    low: 'trending-down' as const,
    medium: 'remove' as const,
    high: 'trending-up' as const,
    urgent: 'alert-circle' as const,
  },
  mood: {
    awful: 'sad' as const,
    bad: 'thumbs-down' as const,
    neutral: 'remove-circle' as const,
    good: 'thumbs-up' as const,
    awesome: 'happy' as const,
  },
  analytics: {
    productivity: 'rocket' as const,
    consistency: 'repeat' as const,
    insights: 'bulb' as const,
  },
};