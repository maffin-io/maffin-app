import React from 'react';
import * as swr from 'swr';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import ThemeButton from '@/components/buttons/ThemeButton';

jest.mock('swr', () => ({
  __esModule: true,
  ...jest.requireActual('swr'),
}));

describe('ThemeButton', () => {
  beforeEach(() => {
    swr.mutate('/state/theme', undefined);
    jest.spyOn(swr, 'mutate');
  });

  it('toggles on click', async () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));

    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    expect(swr.mutate).toBeCalledWith('/state/theme', 'dark', { revalidate: false });
    await waitFor(() => expect(html).toHaveClass('dark'));
  });
});
