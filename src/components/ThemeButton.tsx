import React from 'react';
import { BiSolidMoon, BiSolidSun } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';
import { mutate } from 'swr';

import { useTheme } from '@/hooks/state';

export default function ThemeButton(): JSX.Element {
  const { data: theme } = useTheme();

  let text = 'Change to dark theme';
  if (theme === 'dark') {
    text = 'Change to light theme';
  }

  React.useLayoutEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });

  return (
    <>
      <span
        aria-label="Toggle theme"
        className="text-2xl cursor-pointer"
        data-tooltip-id="theme-help"
        onClick={() => toggleTheme(theme)}
      >
        {
          theme === 'dark' ? <BiSolidSun /> : <BiSolidMoon />
        }
      </span>
      <Tooltip
        id="theme-help"
        className="tooltip"
      >
        {text}
      </Tooltip>
    </>
  );
}

function toggleTheme(currentTheme: 'dark' | 'light' | undefined) {
  if (currentTheme === 'dark') {
    localStorage.setItem('theme', 'light');
    mutate('/state/theme', 'light', { revalidate: false });
    document.documentElement.classList.remove('dark');
  } else {
    localStorage.setItem('theme', 'dark');
    mutate('/state/theme', 'dark', { revalidate: false });
    document.documentElement.classList.add('dark');
  }
}
