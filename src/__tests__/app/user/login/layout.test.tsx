import React from 'react';
import { act, render } from '@testing-library/react';

import LoginLayout from '@/app/user/login/layout';

describe('LoginLayout', () => {
  it('returns loading when script not loaded', () => {
    const { container } = render(
      <LoginLayout>
        <span>child</span>
      </LoginLayout>,
    );

    expect(container).toMatchSnapshot();
  });

  it('loads renders child after loading google account script', async () => {
    const { container } = render(
      <LoginLayout>
        <span>child</span>
      </LoginLayout>,
    );

    // eslint-disable-next-line testing-library/no-node-access
    const accountsScript = document.getElementsByTagName('script')[0];
    if (accountsScript === null) {
      throw new Error('google accounts script not found in document');
    }
    expect(accountsScript.outerHTML).toEqual('<script src="https://accounts.google.com/gsi/client"></script>');

    await act(async () => {
      if (accountsScript.onload === null) {
        throw new Error('accounts script doesnt define an onload function');
      }
      await accountsScript.onload(new Event('load'));
    });

    expect(container).toMatchSnapshot();
  });
});
