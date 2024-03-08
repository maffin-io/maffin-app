import React from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

/**
 * Retrieves the preferred theme for the user by first checking the localStorage
 * and if nothing found there, use system preferences.
 */
export function useTheme(): UseQueryResult<'dark' | 'light'> {
  const result = useQuery({
    queryKey: ['state', 'theme'],
    queryFn: () => {
      const preferredTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      const selectedTheme = localStorage.theme;
      return selectedTheme || preferredTheme;
    },
    enabled: typeof window !== 'undefined',
    gcTime: Infinity,
    networkMode: 'always',
  });

  React.useLayoutEffect(() => {
    if (result.data === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  return result;
}
