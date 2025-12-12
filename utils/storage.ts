import { ActivityItem } from '../types';
import { supabase } from './supabaseClient';

const HISTORY_KEY = 'compressqr_history';

// Get history (Local + Cloud if logged in)
export const getHistory = async (): Promise<ActivityItem[]> => {
  // 1. Get Local
  let localHistory: ActivityItem[] = [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    localHistory = stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Local storage error", e);
  }

  // 2. Get Cloud if session exists
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { data, error } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data && !error) {
       // Transform supabase data to match ActivityItem
       const cloudHistory: ActivityItem[] = data.map(item => ({
         id: item.id.toString(),
         action: item.action,
         file: item.file,
         date: item.created_at,
         size: item.size,
         type: item.type as any
       }));
       return cloudHistory;
    }
  }

  return localHistory;
};

// Add item to history
export const addToHistory = async (item: Omit<ActivityItem, 'id' | 'date'>): Promise<'cloud' | 'local'> => {
  const newItem = {
    ...item,
    id: Date.now().toString(),
    date: new Date().toISOString(),
  };

  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session?.user) {
    // Save to Cloud
    const { error } = await supabase.from('history').insert([{
      user_id: session.user.id,
      action: item.action,
      file: item.file,
      size: item.size,
      type: item.type
    }]);

    if (!error) return 'cloud';
    console.error("Supabase write failed", error);
  }

  // Fallback to Local
  try {
    const currentLocal = localStorage.getItem(HISTORY_KEY);
    const history: ActivityItem[] = currentLocal ? JSON.parse(currentLocal) : [];
    const updated = [newItem, ...history].slice(0, 50);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch(e) {
    // Ignore quota errors
  }
  
  return 'local';
};

export const clearHistory = async () => {
  localStorage.removeItem(HISTORY_KEY);
  // Optional: Add capability to clear cloud history if needed
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