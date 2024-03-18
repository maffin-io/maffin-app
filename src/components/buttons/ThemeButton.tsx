import React from 'react';
import { BiSolidMoon, BiSolidSun } from 'react-icons/bi';

import { Tooltip } from '@/components/tooltips';
import { useTheme } from '@/hooks/state';

export default function ThemeButton(): JSX.Element {
  const { data: theme, refetch } = useTheme();

  let text = 'Change to dark theme';
  if (theme === 'dark') {
    text = 'Change to light theme';
  }

  return (
    <>
      <span
        id="theme-button"
        aria-label="Toggle theme"
        className="text-2xl cursor-pointer"
        data-tooltip-id="theme-help"
        onClick={() => toggleTheme(theme, refetch)}
      >
        {
          theme === 'dark' ? <BiSolidSun /> : <BiSolidMoon />
        }
      </span>
      <Tooltip
        id="theme-help"
        place="right"
      >
        {text}
      </Tooltip>
    </>
  );
}

function toggleTheme(currentTheme: 'dark' | 'light' | undefined, refetch: Function) {
  if (currentTheme === 'dark') {
    localStorage.setItem('theme', 'light');
    refetch();
    document.documentElement.classList.remove('dark');
  } else {
    localStorage.setItem('theme', 'dark');
    refetch();
    document.documentElement.classList.add('dark');
  }
}
