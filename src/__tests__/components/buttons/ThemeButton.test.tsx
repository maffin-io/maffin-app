import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import * as query from '@tanstack/react-query';

import ThemeButton from '@/components/buttons/ThemeButton';

jest.mock('@tanstack/react-query');

describe('ThemeButton', () => {
  let mockRefetch: jest.Mock;

  beforeEach(() => {
    mockRefetch = jest.fn();
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: 'light',
      refetch: mockRefetch as query.UseQueryResult['refetch'],
    } as query.UseQueryResult<'dark' | 'light'>);
  });

  it('adds dark as document class', async () => {
    const { container } = render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html.classList).toHaveLength(0));

    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    expect(mockRefetch).toBeCalledTimes(1);
    await waitFor(() => expect(html).toHaveClass('dark'));
    expect(container).toMatchSnapshot();
  });

  it('removes dark as document class', async () => {
    jest.spyOn(query, 'useQuery').mockReturnValue({
      data: 'dark',
      refetch: mockRefetch as query.UseQueryResult['refetch'],
    } as query.UseQueryResult<'dark' | 'light'>);

    const { container } = render(<ThemeButton />);
    const html = document.documentElement;

    await waitFor(() => expect(html).toHaveClass('dark'));

    const button = screen.getByLabelText('Toggle theme');
    fireEvent.click(button);

    expect(mockRefetch).toBeCalledTimes(1);
    await waitFor(() => expect(html.classList).toHaveLength(0));
    expect(container).toMatchSnapshot();
  });
});
