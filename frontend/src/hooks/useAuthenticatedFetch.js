import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useAuthenticatedFetch() {
  const { session } = useAuth();

  const authFetch = async (url, options = {}) => {
    if (!session) throw new Error('Not authenticated');

    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };

  return authFetch;
}
