import React from 'react';
import { render, waitFor } from '@testing-library/react';
import * as swr from 'swr';

import AccountLayout from '@/app/user/layout';

describe('AccountLayout', () => {
  beforeEach(() => {
    swr.mutate('/state/theme', undefined);
  });

  it('renders as expected', async () => {
    const { container } = render(
      <AccountLayout>
        <span>child</span>
      </AccountLayout>,
    );
    const html = document.documentElement;
    await waitFor(() => expect(html).toHaveClass('dark'));

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
