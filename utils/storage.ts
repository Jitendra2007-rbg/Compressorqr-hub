import { ActivityItem } from '../types';

const HISTORY_KEY = 'compressqr_history';

export const getHistory = (): ActivityItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const addToHistory = (item: Omit<ActivityItem, 'id' | 'date'>) => {
  const history = getHistory();
  const newItem: ActivityItem = {
    ...item,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };
  
  // Keep last 50 items
  const updated = [newItem, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
};

export const clearHistory = () => {
  localStorage.removeItem(HISTORY_KEY);
};

export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};