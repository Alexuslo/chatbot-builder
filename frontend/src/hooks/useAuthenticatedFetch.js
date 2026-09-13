import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useAuthenticatedFetch() {
  const { session } = useAuth();

  const authFetch = async (url, options = {}) => {
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
      },
    });

    return response;
  };

  return authFetch;
}
