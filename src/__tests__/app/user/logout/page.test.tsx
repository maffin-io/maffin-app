import React from 'react';
import { render } from '@testing-library/react';

import LogoutPage from '@/app/user/logout/page';

describe('LogoutPage', () => {
  it('matches snapshot', () => {
    const { container } = render(<LogoutPage />);
    expect(container).toMatchSnapshot();
  });

  it('sets empty accessToken', () => {
    localStorage.setItem('accessToken', 'token');
    render(<LogoutPage />);

    expect(localStorage.getItem('accessToken')).toEqual('');
  });
});
