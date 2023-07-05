import React from 'react';
import { render } from '@testing-library/react';
import type { LinkProps } from 'next/link';

import LogoutPage from '@/app/user/logout/page';

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

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
