import { SWRResponse } from 'swr';
import useSWRImmutable from 'swr/immutable';

export function useTheme(): SWRResponse<'dark' | 'light'> {
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const selectedTheme = localStorage.theme;
  return useSWRImmutable(
    '/state/theme',
    () => selectedTheme || preferredTheme,
  );
}
