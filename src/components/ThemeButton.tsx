import React from 'react';
import { BiSolidMoon, BiSolidSun } from 'react-icons/bi';
import { Tooltip } from 'react-tooltip';

export default function ThemeButton(): JSX.Element {
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const selectedTheme = localStorage.theme;
  const [theme, setTheme] = React.useState<'dark' | 'light'>(selectedTheme || preferredTheme);

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
        onClick={() => toggleTheme(setTheme, theme)}
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

function toggleTheme(setTheme: Function, theme: 'dark' | 'light') {
  if (theme === 'dark') {
    setTheme('light');
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  } else {
    setTheme('dark');
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');
  }
}
