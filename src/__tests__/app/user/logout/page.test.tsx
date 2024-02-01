import React from 'react';
import { render } from '@testing-library/react';
import type { LinkProps } from 'next/link';

import LogoutPage from '@/app/user/logout/page';
import * as sessionHook from '@/hooks/useSession';

jest.mock('next/link', () => jest.fn(
  (
    props: LinkProps & { children?: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>,
  ) => (
    <a className={props.className} href={props.href.toString()}>{props.children}</a>
  ),
));

jest.mock('@/hooks/useSession', () => ({
  __esModule: true,
  ...jest.requireActual('@/hooks/useSession'),
}));

describe('LogoutPage', () => {
  let mockRevoke: jest.Mock;

  beforeEach(() => {
    mockRevoke = jest.fn();
    jest.spyOn(sessionHook, 'default').mockReturnValue({
      revoke: mockRevoke as Function,
    } as sessionHook.SessionReturn);
  });

  it('matches snapshot', () => {
    const { container } = render(<LogoutPage />);
    expect(container).toMatchSnapshot();
  });

  it('sets empty accessToken', () => {
    render(<LogoutPage />);

    expect(mockRevoke).toBeCalled();
  });
});
