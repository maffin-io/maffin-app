import { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

/**
 * Retrieves the preferred theme for the user by first checking the localStorage
 * and if nothing found there, use system preferences.
 */
export function useTheme(): SWRResponse<'dark' | 'light'> {
  const key = typeof window !== 'undefined' ? '/state/theme' : null;
  return useSWRImmutable(
    key,
    () => {
      const preferredTheme = (window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
      const selectedTheme = localStorage.theme;
      return selectedTheme || preferredTheme;
    },
  );
}
