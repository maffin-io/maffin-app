import React from 'react';
import { render, screen } from '@testing-library/react';

import Layout from '@/app/layout';
import RootLayout from '@/layout/RootLayout';

jest.mock('@/layout/RootLayout', () => jest.fn(
  (props: React.PropsWithChildren) => (
    <div data-testid="RootLayout">
      {props.children}
    </div>
  ),
));

describe('Layout', () => {
  it('renders as expected', async () => {
    render(
      <Layout>
        <span>child</span>
      </Layout>,
    );

    await screen.findByText('child');
    expect(RootLayout).toHaveBeenCalled();
  });
});
