import React from 'react';
import { render } from '@testing-library/react';

import AccountLayout from '@/app/user/layout';

describe('AccountLayout', () => {
  it('renders as expected', () => {
    const { container } = render(
      <AccountLayout>
        <span>child</span>
      </AccountLayout>,
    );

    expect(container).toMatchSnapshot();
    expect(document.body.classList).toContain('authentication-bg');
  });
});
