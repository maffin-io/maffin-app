import React from 'react';
import { render, waitFor } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';

import AccountLayout from '@/app/user/layout';
import * as stateHooks from '@/hooks/state';

jest.mock('@/hooks/state', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/state'),
}));

describe('AccountLayout', () => {
  beforeEach(() => {
    jest.spyOn(stateHooks, 'useTheme').mockReturnValue(
      { data: undefined } as UseQueryResult<'dark' | 'light'>,
    );
  });

  it('renders as expected', async () => {
    const { container } = render(
      <AccountLayout>
        <span>child</span>
      </AccountLayout>,
    );

    expect(container).toMatchSnapshot();
  });

  it('sets localstorage theme', async () => {
    localStorage.setItem('theme', 'light');
    render(
      <AccountLayout>
        <span data-testid="child">child</span>
      </AccountLayout>,
    );

    const html = document.documentElement;
    await waitFor(() => expect(html.classList).toHaveLength(0));
  });
});
