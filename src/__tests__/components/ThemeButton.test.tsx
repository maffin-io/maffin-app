import React from 'react';

import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import ThemeButton from '@/components/ThemeButton';

describe('ThemeButton', () => {
  beforeEach(() => {
    // Making it match dark theme by default
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
  });

  it('sets system theme', async () => {
    render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html).toHaveClass('dark'));
  });

  it('sets localstorage theme', async () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));
  });

  it('toggles on click', async () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));

    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    await waitFor(() => expect(html).toHaveClass('dark'));
  });
});
